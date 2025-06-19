const express = require("express");
const router = express.Router();
const upload = require("../middlewares/upload");
const { verifyToken } = require("../middlewares/authMiddleware");
const {
  createOrGetChat,
  sendMessage,
  getChatHistory,
} = require("../controllers/chatController");

router.post("/", verifyToken, createOrGetChat);

router.post("/message", verifyToken, upload.array("media", 20), sendMessage);

router.get("/:chatId", verifyToken, getChatHistory);

module.exports = router;
