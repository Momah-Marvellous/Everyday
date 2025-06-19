const axios = require("axios");
const User = require("../models/User");
require("dotenv").config();

exports.createTransferRecipient = async (req, res) => {
  try {
    const userId = req.user.id;
    const { account_number, bank_code, account_name, currency } = req.body;

    if (!account_number || !bank_code || !account_name) {
      return res
        .status(400)
        .json({
          error: "Account number, bank code, and account name are required",
        });
    }

    // Build the payload for Paystack's Create Transfer Recipient API
    const payload = {
      type: "nuban", // for Nigerian bank accounts
      name: account_name,
      account_number,
      bank_code,
      currency: currency || "NGN", // default to NGN if not provided
    };

    const response = await axios.post(
      "https://api.paystack.co/transferrecipient",
      payload,
      {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    const recipientCode = response.data.data.recipient_code;

    // Store the recipient code in the user's record
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { paystackRecipientCode: recipientCode },
      { new: true }
    );

    res.json({
      message: "Transfer recipient created successfully",
      recipientCode,
      user: updatedUser,
    });
  } catch (error) {
    console.error(
      "Error creating transfer recipient:",
      error.response ? error.response.data : error.message
    );
    res
      .status(500)
      .json({ error: "Server error while creating transfer recipient" });
  }
};
