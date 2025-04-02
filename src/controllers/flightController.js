const blockchainService = require("../config/config.blockchain");

// Insert flight details controller
exports.insertFlightDetails = async (req, res) => {
  try {
    const {
      flightData,
      utcTimes,
      statusData,
      marketingAirlineCodes = [],
      marketingFlightNumbers = [],
    } = req.body;

    const result = await blockchainService.insertFlightDetails(
      flightData,
      utcTimes,
      statusData,
      marketingAirlineCodes,
      marketingFlightNumbers
    );

    // WebSocket notification of REST API update
    // This is in addition to blockchain event listeners
    if (req.webSocketService && flightData.length >= 3) {
      const flightNumber = flightData[0];
      const carrierCode = flightData[2];
      const departureAirport = flightData[6] || "";

      req.webSocketService.notifyFlightSubscribers(flightNumber, carrierCode, {
        type: "apiUpdate",
        flightNumber,
        carrierCode,
        message: "Flight details updated via API",
        timestamp: new Date().toISOString(),
        transactionHash: result.transactionHash,
      });
    }

    res.status(201).json({
      message: "Flight details inserted successfully",
      data: result,
    });
  } catch (error) {
    console.error("Error inserting flight details:", error);
    res.status(500).json({
      error: "Failed to insert flight details",
      details: error.message,
    });
  }
};

// Get flight details controller
exports.getFlightDetails = async (req, res) => {
  try {
    const { flightNumber, scheduledDepartureDate, carrierCode } = req.query;

    // Basic check for required parameters
    if (!flightNumber || !scheduledDepartureDate || !carrierCode) {
      return res.status(400).json({ error: "Missing required parameters" });
    }

    const result = await blockchainService.getFlightDetails(
      flightNumber,
      scheduledDepartureDate,
      carrierCode
    );

    res.json({
      message: "Flight details retrieved successfully",
      data: result,
    });
  } catch (error) {
    console.error("Error getting flight details:", error);

    // Handle not found vs other errors
    if (
      error.message.includes("Invalid input parameters") ||
      error.message.includes("not found")
    ) {
      return res.status(404).json({ error: "Flight not found" });
    }

    res.status(500).json({
      error: "Failed to retrieve flight details",
      details: error.message,
    });
  }
};

// Check flight existence controller
exports.checkFlightExistence = async (req, res) => {
  try {
    const { flightNumber } = req.params;

    const exists = await blockchainService.checkFlightExistence(flightNumber);

    res.json({
      exists,
      flightNumber,
    });
  } catch (error) {
    console.error("Error checking flight existence:", error);
    res.status(500).json({
      error: "Failed to check flight existence",
      details: error.message,
    });
  }
};
