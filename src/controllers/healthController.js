const blockchainService = require("../config/config.blockchain");

// Health check controller
exports.checkHealth = async (req, res) => {
  try {
    const isConnected = await blockchainService.diagnosticContractCheck();
    res.json({
      status: isConnected ? "healthy" : "unhealthy",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Health check error:", error);
    res.status(500).json({
      status: "error",
      message: error.message,
      timestamp: new Date().toISOString(),
    });
  }
};
