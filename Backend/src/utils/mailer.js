const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  // Here we use Gmail as an example. Replace with your email provider's settings.
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER, // your email address
    pass: process.env.EMAIL_PASS, // your email password or app-specific password
  },
});

module.exports = transporter;
