const Notification = require("../models/Notification");

exports.getAllNotifications = async (req, res) => {
  try {
    const userId = req.user.id; // Assuming verifyToken middleware sets req.user
    const notifications = await Notification.find({ user: userId }).sort({
      createdAt: -1,
    });
    res.json(notifications);
  } catch (error) {
    logger.error("Error fetching notifications:", error);
    res.status(500).json({ error: "Server error" });
  }
};

exports.sendNotification = async ({ userId, type, message }) => {
  try {
    const notification = await Notification.create({
      user: userId,
      type,
      message,
    });
    const io = require("../utils/socket").getIO(); // Get the centralized Socket.io instance
    io.to(userId).emit("notification", notification);
    return notification;
  } catch (error) {
    logger.error("Error sending notification:", error);
    throw error;
  }
};

// Mark a notification as read
exports.markNotificationAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const notification = await Notification.findByIdAndUpdate(
      id,
      { read: true },
      { new: true }
    );
    if (!notification) {
      return res.status(404).json({ error: "Notification not found" });
    }
    res.json({ message: "Notification marked as read", notification });
  } catch (error) {
    logger.error("Error marking notification as read:", error);
    res.status(500).json({ error: "Server error" });
  }
};

// Delete a notification
exports.deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;
    const notification = await Notification.findByIdAndDelete(id);
    if (!notification) {
      return res.status(404).json({ error: "Notification not found" });
    }
    res.json({ message: "Notification deleted" });
  } catch (error) {
    logger.error("Error deleting notification:", error);
    res.status(500).json({ error: "Server error" });
  }
};
