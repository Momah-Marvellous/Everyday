const express = require("express");
const router = express.Router();
const { verifyToken } = require("../middlewares/authMiddleware");
const {
  initializeTransaction,
  verifyTransaction,
  withdrawFunds,
} = require("../controllers/paystackController");

router.post("/initialize", initializeTransaction);

router.get("/callback", verifyTransaction);

router.post("/withdraw", verifyToken, withdrawFunds);

module.exports = router;
