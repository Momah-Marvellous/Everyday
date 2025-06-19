const express = require("express");
const router = express.Router();
const { verifyToken } = require("../middlewares/authMiddleware");
const {
  buyForex,
  sellForex,
  getTradeHistory,
} = require("../controllers/forexController");

router.post("/buy", verifyToken, buyForex);
router.post("/sell", verifyToken, sellForex);
router.get("/history", verifyToken, getTradeHistory);

module.exports = router;
