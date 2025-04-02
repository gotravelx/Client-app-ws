class FlightStatusClient {
  constructor(wsUrl) {
    this.wsUrl = wsUrl;
    this.socket = null;
    this.subscriptions = [];
    this.onMessageCallbacks = [];
    this.onStatusUpdateCallbacks = [];
    this.onConnectCallbacks = [];
    this.onDisconnectCallbacks = [];
    this.onErrorCallbacks = [];
    this.connected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 3000; // 3 seconds
  }

  // Connect to WebSocket server
  connect() {
    return new Promise((resolve, reject) => {
      try {
        this.socket = new WebSocket(this.wsUrl);

        this.socket.onopen = () => {
          console.log("Connected to Flight Status WebSocket server");
          this.connected = true;
          this.reconnectAttempts = 0;

          // Resubscribe to previous subscriptions after reconnection
          this.resubscribe();

          // Trigger connect callbacks
          this.onConnectCallbacks.forEach((callback) => callback());
          resolve();
        };

        this.socket.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);

            // Trigger all message callbacks
            this.onMessageCallbacks.forEach((callback) => callback(data));

            // Trigger specific status update callbacks
            if (data.type === "statusUpdate" || data.type === "flightUpdate") {
              this.onStatusUpdateCallbacks.forEach((callback) =>
                callback(data)
              );
            }
          } catch (error) {
            console.error("Error parsing WebSocket message:", error);
          }
        };

        this.socket.onclose = (event) => {
          this.connected = false;
          console.log(
            `WebSocket disconnected. Code: ${event.code}, Reason: ${event.reason}`
          );

          // Trigger disconnect callbacks
          this.onDisconnectCallbacks.forEach((callback) => callback(event));

          // Attempt to reconnect
          this.attemptReconnect();
        };

        this.socket.onerror = (error) => {
          console.error("WebSocket error:", error);

          // Trigger error callbacks
          this.onErrorCallbacks.forEach((callback) => callback(error));
          reject(error);
        };
      } catch (error) {
        console.error("Failed to connect to WebSocket server:", error);
        reject(error);
      }
    });
  }

  // Attempt to reconnect with exponential backoff
  attemptReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      const delay = this.reconnectDelay * Math.pow(1.5, this.reconnectAttempts);
      this.reconnectAttempts++;

      console.log(`Attempting to reconnect in ${delay / 1000} seconds...`);

      setTimeout(() => {
        console.log(`Reconnection attempt ${this.reconnectAttempts}...`);
        this.connect();
      }, delay);
    } else {
      console.error(
        "Maximum reconnection attempts reached. Please reconnect manually."
      );
    }
  }

  // Resubscribe to previous subscriptions
  resubscribe() {
    this.subscriptions.forEach((subscription) => {
      this.sendMessage({
        action: "subscribe",
        ...subscription,
      });
    });
  }

  // Subscribe to flight updates
  subscribeToFlight(flightNumber, carrierCode, departureAirport) {
    return new Promise((resolve, reject) => {
      if (!this.connected) {
        reject(new Error("WebSocket not connected"));
        return;
      }

      // Create subscription object
      const subscription = { flightNumber, carrierCode, departureAirport };

      // Add to subscriptions list
      this.subscriptions.push(subscription);

      // Send subscription request
      this.sendMessage({
        action: "subscribe",
        ...subscription,
      });

      resolve(subscription);
    });
  }

  // Unsubscribe from flight updates
  unsubscribeFromFlight(flightNumber, carrierCode, departureAirport) {
    return new Promise((resolve, reject) => {
      if (!this.connected) {
        reject(new Error("WebSocket not connected"));
        return;
      }

      // Remove from subscriptions list
      this.subscriptions = this.subscriptions.filter(
        (sub) =>
          !(
            sub.flightNumber === flightNumber &&
            sub.carrierCode === carrierCode &&
            sub.departureAirport === departureAirport
          )
      );

      // Send unsubscription request
      this.sendMessage({
        action: "unsubscribe",
        flightNumber,
        carrierCode,
        departureAirport,
      });

      resolve();
    });
  }

  // Send message to server
  sendMessage(message) {
    if (this.connected && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(message));
    } else {
      console.error("Cannot send message: WebSocket not connected");
    }
  }

  // Event listeners
  onMessage(callback) {
    this.onMessageCallbacks.push(callback);
    return this;
  }

  onStatusUpdate(callback) {
    this.onStatusUpdateCallbacks.push(callback);
    return this;
  }

  onConnect(callback) {
    this.onConnectCallbacks.push(callback);
    return this;
  }

  onDisconnect(callback) {
    this.onDisconnectCallbacks.push(callback);
    return this;
  }

  onError(callback) {
    this.onErrorCallbacks.push(callback);
    return this;
  }

  // Close connection
  disconnect() {
    if (this.socket) {
      this.socket.close();
    }
  }
}

// Usage example
document.addEventListener("DOMContentLoaded", () => {
  // Connect to WebSocket server
  const client = new FlightStatusClient("ws://localhost:8000");

  // Set up UI elements
  const connectButton = document.getElementById("connectButton");
  const subscribeButton = document.getElementById("subscribeButton");
  const unsubscribeButton = document.getElementById("unsubscribeButton");
  const statusDisplay = document.getElementById("statusDisplay");

  // Event listeners for successful connection
  client.onConnect(() => {
    statusDisplay.textContent = "Connected to Flight Status service";
    connectButton.disabled = true;
    subscribeButton.disabled = false;
  });

  // Event listener for status updates
  client.onStatusUpdate((data) => {
    const statusElement = document.createElement("div");
    statusElement.className = "status-update";
    statusElement.innerHTML = `
      <p><strong>${data.flightNumber}</strong> (${data.carrierCode})</p>
      <p>Status: ${data.status || data.message}</p>
      <p>Time: ${new Date(data.timestamp).toLocaleString()}</p>
    `;

    const updatesContainer = document.getElementById("updatesContainer");
    updatesContainer.prepend(statusElement);
  });

  // Connect button
  connectButton.addEventListener("click", async () => {
    try {
      statusDisplay.textContent = "Connecting...";
      await client.connect();
    } catch (error) {
      statusDisplay.textContent = `Connection failed: ${error.message}`;
    }
  });

  // Subscribe button
  subscribeButton.addEventListener("click", async () => {
    const flightNumber = document.getElementById("flightNumber").value;
    const carrierCode = document.getElementById("carrierCode").value;
    const departureAirport = document.getElementById("departureAirport").value;

    if (!flightNumber || !carrierCode || !departureAirport) {
      alert("Please enter all flight details");
      return;
    }

    try {
      await client.subscribeToFlight(
        flightNumber,
        carrierCode,
        departureAirport
      );
      statusDisplay.textContent = `Subscribed to flight ${flightNumber}`;
      unsubscribeButton.disabled = false;
    } catch (error) {
      statusDisplay.textContent = `Subscription failed: ${error.message}`;
    }
  });

  // Unsubscribe button
  unsubscribeButton.addEventListener("click", async () => {
    const flightNumber = document.getElementById("flightNumber").value;
    const carrierCode = document.getElementById("carrierCode").value;
    const departureAirport = document.getElementById("departureAirport").value;

    if (!flightNumber || !carrierCode || !departureAirport) {
      alert("Please enter all flight details");
      return;
    }

    try {
      await client.unsubscribeFromFlight(
        flightNumber,
        carrierCode,
        departureAirport
      );
      statusDisplay.textContent = `Unsubscribed from flight ${flightNumber}`;
    } catch (error) {
      statusDisplay.textContent = `Unsubscription failed: ${error.message}`;
    }
  });
});
