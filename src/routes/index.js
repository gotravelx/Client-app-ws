const express = require("express");
const flightController = require("../controllers/flightController");
const subscriptionController = require("../controllers/subscriptionController");
const healthController = require("../controllers/healthController");

const router = express.Router();

// Health check routes
router.get("/health", healthController.checkHealth);

// Flight routes
router.post("/flights", flightController.insertFlightDetails);
router.get("/flights", flightController.getFlightDetails);
router.get(
  "/flights/check-existence/:flightNumber",
  flightController.checkFlightExistence
);

// Subscription routes
router.post("/subscriptions", subscriptionController.addFlightSubscription);
router.delete(
  "/subscriptions",
  subscriptionController.removeFlightSubscriptions
);
router.get(
  "/subscriptions/check",
  subscriptionController.checkFlightSubscription
);

module.exports = router;
