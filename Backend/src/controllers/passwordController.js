const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const PasswordReset = require("../models/PasswordReset");
const transporter = require("../utils/mailer");

// Forgot Password: Generate a reset token and send email
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Generate a secure token
    const token = crypto.randomBytes(20).toString("hex");
    // Set token expiration time (e.g., 1 hour)
    const expiresAt = Date.now() + 3600000; // 1 hour in milliseconds

    // Save or update the token in the PasswordReset collection
    await PasswordReset.findOneAndUpdate(
      { user: user._id },
      { token, expiresAt },
      { upsert: true, new: true }
    );

    // Construct the password reset URL
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Password Reset Request",
      text: `You requested a password reset. Click the following link to reset your password:\n\n${resetUrl}\n\nIf you did not request this, please ignore this email.`,
    };

    // Send the email
    transporter.sendMail(mailOptions, (err, info) => {
      if (err) {
        console.error("Error sending email:", err);
        return res
          .status(500)
          .json({ error: "Error sending password reset email" });
      }
      res.json({ message: "Password reset email sent" });
    });
  } catch (error) {
    console.error("Error in forgotPassword:", error);
    res.status(500).json({ error: "Server error" });
  }
};

// Reset Password: Validate the token and update the password
exports.resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    // Find the PasswordReset entry by token
    const resetEntry = await PasswordReset.findOne({ token });
    if (!resetEntry || resetEntry.expiresAt < Date.now()) {
      return res.status(400).json({ error: "Invalid or expired token" });
    }

    // Find the user and update the password
    const user = await User.findById(resetEntry.user);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Hash the new password before saving
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();

    // Remove the PasswordReset entry now that it's been used
    await PasswordReset.deleteOne({ token });

    res.json({ message: "Password reset successfully" });
  } catch (error) {
    console.error("Error in resetPassword:", error);
    res.status(500).json({ error: "Server error" });
  }
};
