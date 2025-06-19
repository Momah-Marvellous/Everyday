const User = require("../models/User");
const logger = require("../utils/logger");

exports.searchUsers = async (req, res) => {
  try {
    const { query } = req.query;
    if (!query) {
      return res.status(400).json({ error: "Search query is required." });
    }

    const users = await User.find({
      $or: [
        { username: { $regex: query, $options: "i" } },
        { email: { $regex: query, $options: "i" } },
      ],
    }).select("username email profilePicture");

    res.json(users);
  } catch (error) {
    logger.error("Error searching users:", error);
    res.status(500).json({ error: "Server error" });
  }
};

/**
 * Send a friend request from the current user to another user.
 */
exports.sendFriendRequest = async (req, res) => {
  try {
    const senderId = req.user.id;
    const { recipientId } = req.body;

    if (!recipientId) {
      return res.status(400).json({ error: "Recipient ID is required." });
    }

    if (senderId === recipientId) {
      return res
        .status(400)
        .json({ error: "You cannot send a friend request to yourself." });
    }

    const recipient = await User.findById(recipientId);
    if (!recipient) {
      return res.status(404).json({ error: "Recipient not found." });
    }

    // Check if already friends
    if (recipient.friends.includes(senderId)) {
      return res.status(400).json({ error: "You are already friends." });
    }

    // Check if a friend request has already been sent
    if (recipient.friendRequests.includes(senderId)) {
      return res.status(400).json({ error: "Friend request already sent." });
    }

    // Add senderId to recipient's friendRequests array
    recipient.friendRequests.push(senderId);
    await recipient.save();

    res.json({ message: "Friend request sent." });
  } catch (error) {
    logger.error("Error sending friend request:", error);
    res.status(500).json({ error: "Server error" });
  }
};

/**
 * Accept a friend request (i.e., add a friend).
 * The current user accepts a friend request sent by another user.
 */
exports.acceptFriendRequest = async (req, res) => {
  try {
    const currentUserId = req.user.id;
    const { senderId } = req.body; // The user who sent the friend request

    if (!senderId) {
      return res.status(400).json({ error: "Sender ID is required." });
    }

    const currentUser = await User.findById(currentUserId);
    const sender = await User.findById(senderId);

    if (!currentUser || !sender) {
      return res.status(404).json({ error: "User not found." });
    }

    // Ensure there is a pending friend request from sender to current user
    if (!currentUser.friendRequests.includes(senderId)) {
      return res
        .status(400)
        .json({ error: "No friend request from this user." });
    }

    // Remove the friend request from the current user's friendRequests array
    currentUser.friendRequests = currentUser.friendRequests.filter(
      (id) => id.toString() !== senderId
    );

    // Add each user to the other's friends list if not already friends
    if (!currentUser.friends.includes(senderId)) {
      currentUser.friends.push(senderId);
    }
    if (!sender.friends.includes(currentUserId)) {
      sender.friends.push(currentUserId);
    }

    await currentUser.save();
    await sender.save();

    res.json({ message: "Friend request accepted. You are now friends." });
  } catch (error) {
    logger.error("Error accepting friend request:", error);
    res.status(500).json({ error: "Server error" });
  }
};

exports.rejectFriendRequest = async (req, res) => {
  try {
    const currentUserId = req.user.id;
    const { senderId } = req.body; // The user who sent the friend request

    if (!senderId) {
      return res.status(400).json({ error: "Sender ID is required." });
    }

    const currentUser = await User.findById(currentUserId);
    if (!currentUser) {
      return res.status(404).json({ error: "User not found." });
    }

    // Check if the friend request exists
    if (!currentUser.friendRequests.includes(senderId)) {
      return res
        .status(400)
        .json({ error: "No friend request from this user." });
    }

    // Remove the friend request from the current user's friendRequests array
    currentUser.friendRequests = currentUser.friendRequests.filter(
      (id) => id.toString() !== senderId
    );

    await currentUser.save();
    res.json({ message: "Friend request rejected." });
  } catch (error) {
    logger.error("Error rejecting friend request:", error);
    res.status(500).json({ error: "Server error" });
  }
};
