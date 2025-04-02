// controllers/subscriptionController.js

const blockchainService = require("../config/config.blockchain");

// Add flight subscription controller
exports.addFlightSubscription = async (req, res) => {
  try {
    const { flightNumber, carrierCode, departureAirport } = req.body;

    // Basic check for required parameters
    if (!flightNumber || !carrierCode || !departureAirport) {
      return res.status(400).json({ error: "Missing required parameters" });
    }

    const result = await blockchainService.addFlightSubscription(
      flightNumber,
      carrierCode,
      departureAirport
    );

    res.status(201).json({
      message: "Flight subscription added successfully",
      data: result,
    });
  } catch (error) {
    console.error("Error adding flight subscription:", error);
    res.status(500).json({
      error: "Failed to add flight subscription",
      details: error.message,
    });
  }
};

// Remove flight subscriptions controller
exports.removeFlightSubscriptions = async (req, res) => {
  try {
    const { flightNumbers, carrierCodes, departureAirports } = req.body;

    // Basic check for required parameters
    if (
      !flightNumbers?.length ||
      !carrierCodes?.length ||
      !departureAirports?.length
    ) {
      return res.status(400).json({ error: "Missing required parameters" });
    }

    // Basic check for array lengths
    if (
      flightNumbers.length !== carrierCodes.length ||
      flightNumbers.length !== departureAirports.length
    ) {
      return res.status(400).json({
        error:
          "Flight numbers, carrier codes, and departure airports arrays must be of equal length",
      });
    }

    const result = await blockchainService.removeFlightSubscriptions(
      flightNumbers,
      carrierCodes,
      departureAirports
    );

    res.json({
      message: "Flight subscriptions removed successfully",
      data: result,
    });
  } catch (error) {
    console.error("Error removing flight subscriptions:", error);
    res.status(500).json({
      error: "Failed to remove flight subscriptions",
      details: error.message,
    });
  }
};

// Check flight subscription status controller
exports.checkFlightSubscription = async (req, res) => {
  try {
    const { userAddress, flightNumber, carrierCode, departureAirport } =
      req.query;

    // Basic check for required parameters
    if (!userAddress || !flightNumber || !carrierCode || !departureAirport) {
      return res.status(400).json({ error: "Missing required parameters" });
    }

    const isSubscribed = await blockchainService.checkFlightSubscription(
      userAddress,
      flightNumber,
      carrierCode,
      departureAirport
    );

    res.json({
      isSubscribed,
      userAddress,
      flightNumber,
      carrierCode,
      departureAirport,
    });
  } catch (error) {
    console.error("Error checking flight subscription:", error);
    res.status(500).json({
      error: "Failed to check flight subscription",
      details: error.message,
    });
  }
};
