const express = require("express");
const router = express.Router();
const { verifyToken } = require("../middlewares/authMiddleware");
const {
  sendNotification,
  markNotificationAsRead,
  deleteNotification,
  getAllNotifications,
} = require("../controllers/notificationController");

// (Optional) Endpoint to trigger sending a notification manually
router.post("/", verifyToken, async (req, res) => {
  try {
    const { userId, type, message } = req.body;
    const notification = await sendNotification({ userId, type, message });
    res.json({ message: "Notification sent", notification });
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

// Mark a notification as read
router.put("/:id/read", verifyToken, markNotificationAsRead);

// Delete a notification
router.delete("/:id", verifyToken, deleteNotification);

// Get all notifications for the authenticated user
router.get("/", verifyToken, getAllNotifications);

module.exports = router;
