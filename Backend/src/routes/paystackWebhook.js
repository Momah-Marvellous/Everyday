const express = require("express");
const router = express.Router();
const { handleWebhook } = require("../controllers/paystackWebhookController");

// Use express.raw to capture the raw body as a Buffer
router.post(
  "/webhook",
  express.raw({ type: "application/json" }),
  handleWebhook
);

module.exports = router;
