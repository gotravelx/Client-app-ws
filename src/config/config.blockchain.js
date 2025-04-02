const {
  createFlightBlockchainService,
} = require("../services/blockchainService.js");
const dotenv = require("dotenv");
const { default: ContractAbi } = require("../utils/abi.js");

dotenv.config();
// Environment configuration
const contractABI = ContractAbi;
const contractAddress = process.env.CONTRACT_ADDRESS;
const walletAddress = process.env.WALLET_ADDRESS;
const privateKey = process.env.PRIVATE_KEY;
const blockchainProvider = process.env.PROVIDER_URL;

//Create blockchain service instance
const blockchainService = createFlightBlockchainService(
  blockchainProvider,
  contractAddress,
  contractABI,
  privateKey,
  walletAddress
);

// Since we're in a CommonJS environment, we need to handle the await differently
// by wrapping the async code in an immediately invoked async function
(async () => {
  const isConnected = await blockchainService.diagnosticContractCheck();

  if (!isConnected) {
    console.error("Contract connectivity check failed");
  } else console.log("Blockchain service initialized successfully");
})();

module.exports = blockchainService;
