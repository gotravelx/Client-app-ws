// services/websocketService.js
const WebSocket = require("ws");
const { ethers } = require("ethers");
const { default: ContractAbi } = require("../utils/abi");

require("dotenv").config();

class WebSocketService {
  constructor(server) {
    // Initialize WebSocket server
    this.wss = new WebSocket.Server({ server });
    this.clients = new Map(); // Map to store client connections by subscribed flight

    // Initialize blockchain event listeners
    this.initBlockchainEventListeners();

    // Handle WebSocket connections
    this.setupConnectionHandler();
  }

  setupConnectionHandler() {
    this.wss.on("connection", (ws, req) => {
      console.log("Client connected to WebSocket");

      // Handle client messages (subscription requests)
      ws.on("message", (message) => {
        try {
          const data = JSON.parse(message);

          // Handle subscribe request
          if (data.action === "subscribe") {
            this.handleSubscription(ws, data);
          }
          // Handle unsubscribe request
          else if (data.action === "unsubscribe") {
            this.handleUnsubscription(ws, data);
          }
        } catch (error) {
          console.error("Error processing WebSocket message:", error);
          ws.send(
            JSON.stringify({
              type: "error",
              message: "Invalid message format",
            })
          );
        }
      });

      // Handle client disconnection
      ws.on("close", () => {
        this.removeClient(ws);
        console.log("Client disconnected from WebSocket");
      });

      // Send welcome message
      ws.send(
        JSON.stringify({
          type: "info",
          message: "Connected to Flight Blockchain WebSocket Server",
        })
      );
    });
  }

  handleSubscription(ws, data) {
    // Extract flight subscription details
    const { flightNumber, carrierCode, departureAirport } = data;

    if (!flightNumber || !carrierCode || !departureAirport) {
      ws.send(
        JSON.stringify({
          type: "error",
          message: "Missing required subscription parameters",
        })
      );
      return;
    }

    // Create subscription key
    const subscriptionKey = `${flightNumber}:${carrierCode}:${departureAirport}`;

    // Store client subscription
    ws.subscriptions = ws.subscriptions || [];
    ws.subscriptions.push(subscriptionKey);

    // Add client to subscription map
    if (!this.clients.has(subscriptionKey)) {
      this.clients.set(subscriptionKey, new Set());
    }
    this.clients.get(subscriptionKey).add(ws);

    console.log(`Client subscribed to flight: ${subscriptionKey}`);

    // Confirm subscription
    ws.send(
      JSON.stringify({
        type: "subscription",
        status: "success",
        message: `Subscribed to flight ${flightNumber}`,
        data: { flightNumber, carrierCode, departureAirport },
      })
    );
  }

  handleUnsubscription(ws, data) {
    // Extract flight subscription details
    const { flightNumber, carrierCode, departureAirport } = data;

    if (!flightNumber || !carrierCode || !departureAirport) {
      ws.send(
        JSON.stringify({
          type: "error",
          message: "Missing required unsubscription parameters",
        })
      );
      return;
    }

    // Create subscription key
    const subscriptionKey = `${flightNumber}:${carrierCode}:${departureAirport}`;

    // Remove subscription
    if (ws.subscriptions) {
      ws.subscriptions = ws.subscriptions.filter(
        (sub) => sub !== subscriptionKey
      );
    }

    // Remove from clients map
    if (this.clients.has(subscriptionKey)) {
      this.clients.get(subscriptionKey).delete(ws);

      // Clean up empty sets
      if (this.clients.get(subscriptionKey).size === 0) {
        this.clients.delete(subscriptionKey);
      }
    }

    console.log(`Client unsubscribed from flight: ${subscriptionKey}`);

    // Confirm unsubscription
    ws.send(
      JSON.stringify({
        type: "unsubscription",
        status: "success",
        message: `Unsubscribed from flight ${flightNumber}`,
        data: { flightNumber, carrierCode, departureAirport },
      })
    );
  }

  removeClient(ws) {
    // Remove client from all subscriptions
    if (ws.subscriptions) {
      for (const subscriptionKey of ws.subscriptions) {
        if (this.clients.has(subscriptionKey)) {
          this.clients.get(subscriptionKey).delete(ws);

          // Clean up empty sets
          if (this.clients.get(subscriptionKey).size === 0) {
            this.clients.delete(subscriptionKey);
          }
        }
      }
    }
  }

  initBlockchainEventListeners() {
    try {
      // Initialize ethers provider
      const provider = new ethers.providers.JsonRpcProvider(
        process.env.PROVIDER_URL
      );

      // Initialize contract
      const contract = new ethers.Contract(
        process.env.CONTRACT_ADDRESS,
        ContractAbi,
        provider
      );

      // Listen for FlightDataSet events
      contract.on(
        "FlightDataSet",
        (
          flightNumber,
          scheduledDepartureDate,
          carrierCode,
          arrivalCity,
          departureCity,
          arrivalAirport,
          departureAirport,
          operatingAirlineCode,
          arrivalGate,
          departureGate,
          currentFlightStatus
        ) => {
          console.log(`Flight data updated: ${flightNumber}`);

          // Create notification message
          const notificationData = {
            type: "flightUpdate",
            flightNumber,
            carrierCode,
            departureAirport,
            arrivalAirport,
            status: currentFlightStatus,
            timestamp: new Date().toISOString(),
          };

          // Notify subscribed clients
          this.notifySubscribers(
            `${flightNumber}:${carrierCode}:${departureAirport}`,
            notificationData
          );
        }
      );

      // Listen for currentFlightStatus events
      contract.on(
        "currentFlightStatus",
        (
          flightNumber,
          scheduledDepartureDate,
          currentFlightStatusTime,
          carrierCode,
          FlightStatus,
          FlightStatusCode
        ) => {
          console.log(
            `Flight status changed: ${flightNumber} - ${FlightStatus}`
          );

          // Create status update message
          const statusData = {
            type: "statusUpdate",
            flightNumber,
            carrierCode,
            status: FlightStatus,
            statusCode: FlightStatusCode,
            statusTime: currentFlightStatusTime,
            timestamp: new Date().toISOString(),
          };

          // Notify all relevant subscribers
          // Since departureAirport is not included in this event, we need a different approach
          this.notifyFlightSubscribers(flightNumber, carrierCode, statusData);
        }
      );

      console.log("Blockchain event listeners initialized successfully");
    } catch (error) {
      console.error("Failed to initialize blockchain event listeners:", error);
    }
  }

  notifySubscribers(subscriptionKey, data) {
    if (this.clients.has(subscriptionKey)) {
      const subscribers = this.clients.get(subscriptionKey);

      console.log(
        `Notifying ${subscribers.size} clients about flight: ${subscriptionKey}`
      );

      for (const client of subscribers) {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify(data));
        }
      }
    }
  }

  notifyFlightSubscribers(flightNumber, carrierCode, data) {
    // Find all subscription keys that start with flightNumber:carrierCode
    for (const [key, subscribers] of this.clients.entries()) {
      const [subFlightNumber, subCarrierCode] = key.split(":");

      if (subFlightNumber === flightNumber && subCarrierCode === carrierCode) {
        console.log(`Notifying subscribers of ${key} about status update`);

        for (const client of subscribers) {
          if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(data));
          }
        }
      }
    }
  }

  // Public method to broadcast messages to all connected clients
  broadcastMessage(message) {
    this.wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(message));
      }
    });
  }
}

module.exports = WebSocketService;
