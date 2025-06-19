const User = require("../models/User");
const logger = require("../utils/logger");

exports.getProfile = async (req, res) => {
  try {
    const userId = req.user && req.user.id;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    const user = await User.findById(userId).select(
      "username email role profilePicture"
    );
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json(user);
  } catch (error) {
    logger.error("Error fetching profile:", error);
    res.status(500).json({ error: "Server error" });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const { username, profilePicture } = req.body;
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ error: "User not found" });

    // Update fields if provided
    user.username = username || user.username;
    user.profilePicture = profilePicture || user.profilePicture;
    await user.save();

    res.json({ message: "Profile updated", user });
  } catch (error) {
    logger.error("Error updating profile:", error);
    res.status(500).json({ error: "Server error" });
  }
};

exports.updateProfilePicture = async (req, res) => {
  try {
    // Ensure the user is authenticated; verifyToken middleware should set req.user
    const userId = req.user && req.user.id;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    // Ensure a file was uploaded
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }
    // Construct a URL or path for the uploaded file
    const profilePictureUrl = `../uploads/${req.file.filename}`;

    // Find the user by ID using Mongoose's findById
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Update the user's profile picture
    user.profilePicture = profilePictureUrl;
    await user.save();

    res.json({
      message: "Profile picture updated",
      profilePicture: profilePictureUrl,
    });
  } catch (error) {
    logger.error("Error updating profile picture:", error);
    res.status(500).json({ error: "Server error" });
  }
};

exports.deleteUser = async (req, res) => {
  const id = req.params.id;
  try {
    await User.findByIdAndDelete(id);
    res.status(200).json("User's data deleted successfully!");
  } catch (err) {
    res.status(500).json({ err: "Unable to delete User's Data" });
  }
};
