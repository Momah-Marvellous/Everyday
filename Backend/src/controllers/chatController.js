const Chat = require("../models/Chat");
const Message = require("../models/Message");
const logger = require("../utils/logger");

exports.createOrGetChat = async (req, res) => {
  try {
    const currentUserId = req.user.id;
    const { recipientId } = req.body;

    if (!recipientId) {
      return res.status(400).json({ error: "Recipient ID is required." });
    }

    // Check if a chat already exists between these two users
    let chat = await Chat.findOne({
      participants: { $all: [currentUserId, recipientId] },
    });

    // If not, create a new chat
    if (!chat) {
      chat = new Chat({ participants: [currentUserId, recipientId] });
      await chat.save();
    }

    res.status(200).json(chat);
  } catch (error) {
    logger.error("Error in createOrGetChat:", error);
    res.status(500).json({ error: "Server error" });
  }
};

/**
 * Send a message in a chat.
 * Expects req.body.chatId and req.body.content.
 */
exports.sendMessage = async (req, res) => {
  try {
    const currentUserId = req.user.id;
    const { chatId, content } = req.body;

    if (!chatId) {
      return res.status(400).json({ error: "Chat ID is required." });
    }

    // Ensure that either text content or a file is provided
    if (!content && (!req.files || req.files.length === 0)) {
      return res
        .status(400)
        .json({ error: "Message content or media is required." });
    }

    // If a media file is uploaded, construct its URL
    let mediaUrls = [];
    if (req.files && req.files.length > 0) {
      mediaUrls = req.files.map((file) => `../uploads/${file.filename}`);
    }

    // Create a new message with text content and/or media URL
    const message = new Message({
      chat: chatId,
      sender: currentUserId,
      content: content || "",
      media: mediaUrls,
    });
    await message.save();
    await Chat.findById(chatId).updateOne({ messages: [message.id] });

    res.status(201).json({ message: "Message sent", data: message });
  } catch (error) {
    logger.error("Error sending message:", error);
    res.status(500).json({ error: "Server error" });
  }
};

/**
 * Retrieve chat history for a specific chat.
 * Expects req.params.chatId.
 */
exports.getChatHistory = async (req, res) => {
  try {
    const currentUserId = req.user.id;
    const { chatId } = req.params;

    if (!chatId) {
      return res.status(400).json({ error: "Chat ID is required." });
    }

    // Verify the current user is a participant in the chat
    const chat = await Chat.findById(chatId);
    if (!chat || !chat.participants.includes(currentUserId)) {
      return res.status(403).json({ error: "Access denied." });
    }

    // Retrieve messages sorted by creation time
    const messages = await Message.find({ chat: chatId }).sort({
      createdAt: 1,
    });
    res.status(200).json({ chat, messages });
  } catch (error) {
    logger.error("Error getting chat history:", error);
    res.status(500).json({ error: "Server error" });
  }
};
