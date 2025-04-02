import { FlightBlockchainService } from "../services/contract";

const checkBlockchainConnection = async (req, res, next) => {
  try {
    const isConnected = await FlightBlockchainService.diagnosticContractCheck();
    if (!isConnected) {
      return res.status(503).json({ error: "Blockchain service unavailable" });
    }
    next();
  } catch (error) {
    console.error("Blockchain connection error:", error);
    return res
      .status(503)
      .json({ error: "Blockchain service connection error" });
  }
};
