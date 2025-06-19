const express = require("express");
const router = express.Router();
const { verifyToken } = require("../middlewares/authMiddleware");
const {
  createOrder,
  getOrderHistory,
} = require("../controllers/orderController");

// Create a new order (purchase products)
router.post("/", verifyToken, createOrder);

// Get order history for the current user
router.get("/history", verifyToken, getOrderHistory);

module.exports = router;
