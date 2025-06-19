const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const transporter = require("../utils/mailer");
const logger = require("../utils/logger");

// Helper: Generate a 6-digit verification code
const generateVerificationCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Register new user with email verification
exports.register = async (req, res) => {
  const { username, email, password, adminCode } = req.body;

  try {
    // Check if the user already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res
        .status(400)
        .json({ error: "User with that email already exists." });
    }

    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const role = adminCode === process.env.ADMIN_CODE ? "admin" : "user";

    // Generate verification code and expiry (1 hour from now)
    const verificationCode = generateVerificationCode();
    const verificationCodeExpires = new Date(Date.now() + 60 * 60 * 1000);
    console.log(verificationCodeExpires);
    console.log("Stored code:", "Provided code:", verificationCode);

    // Create the user record with isVerified set to false
    const newUser = await User.create({
      username,
      email,
      password: hashedPassword,
      role,
      isVerified: false,
      verificationCode,
      verificationCodeExpires,
    });

    // Send verification email
    // const mailOptions = {
    //   from: process.env.EMAIL_USER,
    //   to: email,
    //   subject: "Verify Your Account",
    //   text: `Thank you for registering, ${username}.\n\nYour verification code is: ${verificationCode}\nThis code will expire in 1 hour.`,
    // };

    // transporter.sendMail(mailOptions, async (error, info) => {
    //   if (error) {
    //     logger.error("Error sending verification email:", error);
    //     try {
    //       // Delete the user record if email sending fails
    //       await newUser.destroy();
    //       logger.info("User record deleted due to email failure.");
    //     } catch (destroyError) {
    //       logger.error(
    //         "Error deleting user record after email failure:",
    //         destroyError
    //       );
    //     }
    //     return res.status(500).json({
    //       error: "Failed to send verification email. Please try again.",
    //     });
    //   } else {
    //     logger.info("Verification email sent:", info.response);
    //     res.status(201).json({
    //       message:
    //         "User registered successfully. Please check your email for the verification code.",
    //     });
    //   }
    // });
    res.status(201).json({ message: "User Created Successfully" });
    newUser.save();
  } catch (error) {
    logger.error("Registration error:", error);
    res.status(500).json({ error: "Server error" });
  }
};

// Login user
exports.login = async (req, res) => {
  const { username, password } = req.body;

  try {
    // Find the user by email
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(400).json({ error: "Invalid credentials oo" });
    }

    // Compare passwords
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: "Invalid credentials" });
    }

    // Create JWT payload
    const payload = {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
    };
    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });

    res.status(200).json({
      message: "User logged in successfully",
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        name: user.name,
      },
    });
  } catch (error) {
    logger.error("Login error:", error);
    res.status(500).json({ error: "Server error" });
  }
};

// Verify email endpoint
exports.verifyEmail = async (req, res) => {
  const { email } = req.body;

  try {
    // Find the user by email
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(400).json({ error: "User not found." });
    }
    const verificationCode = Math.floor(
      100000 + Math.random() * 900000
    ).toString();
    user.verificationCode = verificationCode;
    user.verificationCodeExpires = new Date(Date.now() + 3600000); // valid for 1 hour
    await user.save();
    logger.info(
      "Stored code:",
      user.verificationCode,
      "Provided code:",
      verificationCode
    );
    if (user.isVerified) {
      return res.status(400).json({ error: "User already verified." });
    }
    if (user.verificationCode !== verificationCode) {
      return res.status(400).json({ error: "Invalid verification code." });
    }
    if (user.verificationCodeExpires < new Date()) {
      return res.status(400).json({ error: "Verification code has expired." });
    }

    // Mark user as verified and clear the verification fields
    user.isVerified = true;
    user.verificationCode = null;
    user.verificationCodeExpires = null;
    await user.save();

    // Optionally, generate a JWT token now that the email is verified
    const payload = { id: user.id, email: user.email, role: user.role };
    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });

    res.json({ message: "Email verified successfully.", token });
  } catch (error) {
    logger.error("Email verification error:", error);
    res.status(500).json({ error: "Server error." });
  }
};
