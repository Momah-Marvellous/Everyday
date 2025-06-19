const express = require("express");
const router = express.Router();
const {
  forgotPassword,
  resetPassword,
} = require("../controllers/passwordController");

// Endpoint for requesting a password reset
router.post("/forgot", forgotPassword);

// Endpoint for resetting the password using the token
router.post("/reset", resetPassword);

module.exports = router;
