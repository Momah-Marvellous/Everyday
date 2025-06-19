const express = require("express");
const router = express.Router();

const { processWithdrawal } = require("../controllers/withdrawalController");
const { verifyToken } = require("../middlewares/authMiddleware");
const {
  createWallet,
  getWallet,
  deposit,
  withdraw,
  transfer,
} = require("../controllers/walletController");

// Create a wallet for the authenticated user
router.post("/create", verifyToken, createWallet);

// Get the authenticated user's wallet
router.get("/", verifyToken, getWallet);

// Deposit funds
router.post("/deposit", verifyToken, deposit);

// Withdraw funds
router.post("/withdraw", verifyToken, withdraw);

// Transfer funds to another user
router.post("/transfer", verifyToken, transfer);

module.exports = router;

// Route for processing withdrawal requests
router.post("/withdraw", verifyToken, processWithdrawal);

module.exports = router;
