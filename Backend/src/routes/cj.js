const express = require("express");
const router = express.Router();
const { verifyToken } = require("../middlewares/authMiddleware");
const { createCJOrder } = require("../controllers/cjController");

// Protected endpoint to create a CJ Dropshipping order
router.post("/order", verifyToken, createCJOrder);

module.exports = router;
