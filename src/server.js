const express = require("express");
const http = require("http");
const helmet = require("helmet");
const cors = require("cors");
const routes = require("./routes");
const WebSocketService = require("./services/websocketService");
require("dotenv").config();

// Create Express app
const app = express();

// Create HTTP server
const server = http.createServer(app);

// Initialize WebSocket service
const webSocketService = new WebSocketService(server);

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Make webSocketService available to routes
app.use((req, res, next) => {
  req.webSocketService = webSocketService;
  next();
});

// Routes
app.use("/api", routes);

// Error handling for non-existent routes
app.use((req, res) => {
  res.status(404).json({ error: "Endpoint not found" });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({
    error: "Internal server error",
    details:
      process.env.NODE_ENV === "production"
        ? "Something went wrong"
        : err.message,
  });
});

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Flight Blockchain API server running on port ${PORT}`);
  console.log(`WebSocket server available at ws://localhost:8000`);
});

module.exports = app;
