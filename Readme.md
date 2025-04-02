# WebSocket Implementation for Real-Time Flight Status Updates

## Project Overview

This project integrates WebSocket functionality to provide real-time flight status updates to users. The system listens to blockchain events and REST API updates, pushing notifications to connected clients about flight status changes.

---

## Features

### Server-Side Components

1. **WebSocketService**

   - Manages WebSocket connections and subscriptions.
   - Listens to blockchain events.
   - Notifies subscribed clients about flight updates.
   - Handles subscription/unsubscription requests.

2. **Blockchain Event Listeners**

   - Captures `FlightDataSet` and `currentFlightStatus` events.
   - Processes flight status changes emitted by the blockchain.

3. **REST API Integration**
   - Updates the flight controller to trigger WebSocket notifications when flight data is modified.
   - Shares the WebSocketService instance through Express middleware.

---

### Client-Side Components

1. **FlightStatusClient Class**

   - Establishes and manages WebSocket connections.
   - Handles flight subscriptions and automatic reconnections using exponential backoff.
   - Provides event-based callbacks for status updates.
   - Restores subscriptions after disconnection.

2. **Demo HTML Interface**
   - Simple UI demonstrating WebSocket functionality.
   - Includes connection controls, subscription management, and real-time updates display.

---

## Flow of Data

### User Flow

1. Users connect to the WebSocket server.
2. Users subscribe to specific flights using flight number, carrier code, and departure airport.
3. Users receive real-time updates when subscribed flight statuses change.

### System Flow

1. Blockchain emits flight status change events.
2. Server captures these events using `ethers.js`.
3. Server identifies subscribed clients and sends updates via WebSockets.
4. REST API updates also trigger WebSocket notifications.

---

## Security and Reliability Features

- **Automatic Reconnection:** Clients reconnect automatically with exponential backoff logic.
- **Subscription Restoration:** Subscriptions are restored after reconnection.
- **Error Handling:** Comprehensive error handling ensures smooth operation.
- **Client Tracking:** Efficient tracking of subscribed clients using Maps and Sets.

---

## Installation Instructions

### Prerequisites

- Node.js installed on your system.
- An API key for accessing the Flight Status service (e.g., SITA or Amadeus APIs).

### Steps

1. Clone the repository:
   ```sh
   git clone https://github.com/your-repo/websocket-flight-status.git
   ```
2. Navigate to the project directory:
   ```sh
   cd websocket-flight-status
   ```
3. Install dependencies:
   ```sh
   npm install
   ```
4. Start the server:
   ```sh
   npm start
   ```

---

## Usage

1. Open the demo HTML file in a browser.
2. Connect to the WebSocket server.
3. Subscribe to flight status updates.
4. View real-time updates in the UI.

---

## License

This project is licensed under the MIT License. See the LICENSE file for details.
