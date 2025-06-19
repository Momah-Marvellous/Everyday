const User = require("../models/User");
const logger = require("../utils/logger");
const Transaction = require("../models/Transaction");
const Media = require("../models/Media");
const Movie = require("../models/Movie");
const bcrypt = require("bcryptjs");
const Report = require("../models/Report");
const { Parser } = require("json2csv");

// Export all users to CSV
exports.exportUsersCSV = async (req, res) => {
  try {
    const users = await User.find({}, "username email status createdAt");
    const fields = ["username", "email", "status", "createdAt"];
    const parser = new Parser({ fields });
    const csv = parser.parse(users);
    res.header("Content-Type", "text/csv");
    res.attachment("users.csv");
    res.send(csv);
  } catch (error) {
    console.error("Error exporting users:", error);
    res.status(500).json({ error: "Server error" });
  }
};

// Export all transactions to CSV
exports.exportTransactionsCSV = async (req, res) => {
  try {
    const transactions = await Transaction.find({})
      .populate("user", "username")
      .sort({ createdAt: -1 });
    const fields = ["_id", "type", "amount", "status", "createdAt"];
    const parser = new Parser({ fields });
    const csv = parser.parse(transactions);
    res.header("Content-Type", "text/csv");
    res.attachment("transactions.csv");
    res.send(csv);
  } catch (error) {
    console.error("Error exporting transactions:", error);
    res.status(500).json({ error: "Server error" });
  }
};

exports.getAllReports = async (req, res) => {
  try {
    const reports = await Report.find({})
      .populate("reporter", "username email")
      .sort({ createdAt: -1 });
    res.json(reports);
  } catch (error) {
    console.error("Error fetching reports:", error);
    res.status(500).json({ error: "Server error" });
  }
};

exports.updateUserStatus = async (req, res) => {
  try {
    const { userId, status } = req.body; // e.g., status can be "banned" or "active"
    const user = await User.findByIdAndUpdate(
      userId,
      { status },
      { new: true }
    );
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json({ message: "User status updated", user });
  } catch (error) {
    console.error("Error updating user status:", error);
    res.status(500).json({ error: "Server error" });
  }
};

exports.getTransactionAnalytics = async (req, res) => {
  try {
    // Group transactions by type, summing the total amount and count for each type
    const analytics = await Transaction.aggregate([
      {
        $group: {
          _id: "$type",
          totalAmount: { $sum: "$amount" },
          count: { $sum: 1 },
        },
      },
    ]);
    res.json(analytics);
  } catch (error) {
    console.error("Error fetching transaction analytics:", error);
    res.status(500).json({ error: "Server error" });
  }
};

exports.uploadMovie = async (req, res) => {
  try {
    const { title, description } = req.body;

    // Ensure a movie file is uploaded
    if (!req.file) {
      return res.status(400).json({ error: "No movie file uploaded" });
    }
    // Construct the movie file URL. Assuming files are served from the "uploads" directory.
    const movieUrl = `/uploads/${req.file.filename}`;

    // Optional: if a thumbnail file is uploaded via a field named "thumbnailFile"
    let thumbnailUrl = req.body.thumbnailUrl; // Use a URL provided in the body if available
    if (req.files && req.files.thumbnailFile) {
      thumbnailUrl = `/uploads/${req.files.thumbnailFile[0].filename}`;
    }

    // Create the new movie document
    const movie = new Movie({
      title,
      description,
      movieUrl,
      thumbnailUrl,
    });

    await movie.save();
    res.status(201).json({ message: "Movie uploaded successfully", movie });
  } catch (error) {
    console.error("Error uploading movie:", error);
    res.status(500).json({ error: "Server error" });
  }
};

exports.getDashboardData = async (req, res) => {
  try {
    // Get total count of users, transactions, and media uploads
    const usersCount = await User.countDocuments({});
    const transactionsCount = await Transaction.countDocuments({});
    const mediaCount = await Media.countDocuments({});
    const pendingWithdrawals = await WithdrawalRequest.countDocuments({
      status: "pending",
    });

    res.json({
      usersCount,
      transactionsCount,
      mediaCount,
      pendingWithdrawals,
    });
  } catch (error) {
    console.error("Error fetching dashboard data:", error);
    res.status(500).json({ error: "Server error" });
  }
};

exports.getAllForexTrades = async (req, res) => {
  try {
    const trades = await ForexTrade.find({})
      .populate("user", "username email")
      .sort({ createdAt: -1 });
    res.json(trades);
  } catch (error) {
    console.error("Error fetching forex trades:", error);
    res.status(500).json({ error: "Server error" });
  }
};

exports.getUsersDetails = async (req, res) => {
  try {
    const users = await User.aggregate([
      // Lookup transactions where the user is the sender
      {
        $lookup: {
          from: "transactions", // collection name for transactions
          localField: "_id",
          foreignField: "from",
          as: "sentTransactions",
        },
      },
      // Lookup transactions where the user is the receiver
      {
        $lookup: {
          from: "transactions",
          localField: "_id",
          foreignField: "to",
          as: "receivedTransactions",
        },
      },
      // Lookup media uploads (assuming Media model has an uploader field)
      {
        $lookup: {
          from: "media", // collection name for media documents
          localField: "_id",
          foreignField: "uploader",
          as: "mediaUploads",
        },
      },
      // Add fields for counts
      {
        $addFields: {
          totalTransactions: {
            $add: [
              { $size: "$sentTransactions" },
              { $size: "$receivedTransactions" },
            ],
          },
          mediaCount: { $size: "$mediaUploads" },
          friendCount: { $size: "$friends" },
        },
      },
      // Project only the necessary fields
      {
        $project: {
          username: 1,
          email: 1,
          role: 1,
          profilePicture: 1,
          totalTransactions: 1,
          mediaCount: 1,
          friendCount: 1,
        },
      },
    ]);

    res.json(users);
  } catch (error) {
    console.error("Error fetching user details:", error);
    res.status(500).json({ error: "Server error" });
  }
};

exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find({}, "username email role status").sort({
      createdAt: -1,
    });
    res.json(users);
  } catch (error) {
    logger.error("Error fetching users:", error);
    res.status(500).json({ error: "Server error" });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params; // Correctly extracting id from req.params
    const user = await User.findByIdAndDelete(id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json({ message: "User deleted successfully" });
  } catch (error) {
    logger.error("Error deleting user:", error);
    res.status(500).json({ error: "Server error" });
  }
};
