const express = require("express");
const router = express.Router();
const { verifyToken } = require("../middlewares/authMiddleware");
const {
  createTransferRecipient,
} = require("../controllers/paystackRecipientController");

// Endpoint to create a transfer recipient
// POST /api/paystack/recipient
router.post("/recipient", verifyToken, createTransferRecipient);

module.exports = router;
