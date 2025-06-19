const express = require("express");
const router = express.Router();
const {
  initiateDeposit,
  verifyTransaction,
} = require("../controllers/flutterwaveController");

// Route to initiate a deposit (create payment link)
router.post("/deposit", initiateDeposit);

// Route to verify a transaction (can be used as a callback endpoint)
router.get("/callback", verifyTransaction);

module.exports = router;
