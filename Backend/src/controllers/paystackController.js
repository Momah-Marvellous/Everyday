const axios = require("axios");
const Wallet = require("../models/Wallet");
const Transaction = require("../models/Transaction"); // Optional: for tracking deposits
require("dotenv").config();

// Initialize a transaction via Paystack
exports.initializeTransaction = async (req, res) => {
  try {
    const { amount, email } = req.body;
    if (!amount || !email) {
      return res.status(400).json({ error: "Amount and email are required" });
    }

    // Paystack requires the amount in kobo (if currency is NGN). For example, if amount is in NGN:
    const convertedAmount = amount * 100;

    const response = await axios.post(
      "https://api.paystack.co/transaction/initialize",
      {
        amount: convertedAmount,
        email,
        callback_url: process.env.PAYSTACK_CALLBACK_URL,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    // Optionally, store a pending transaction in your database with the reference
    // const transaction = await Transaction.create({ user: req.user.id, amount, reference: response.data.data.reference, status: 'pending' });

    res.json(response.data); // Contains an authorization_url for the user to complete payment
  } catch (error) {
    console.error(
      "Error initializing transaction:",
      error.response ? error.response.data : error.message
    );
    res.status(500).json({ error: "Failed to initialize transaction" });
  }
};

// Verify the transaction via Paystack callback
exports.verifyTransaction = async (req, res) => {
  try {
    const { reference } = req.query;
    if (!reference) {
      return res.status(400).json({ error: "Reference is required" });
    }

    const response = await axios.get(
      `https://api.paystack.co/transaction/verify/${reference}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        },
      }
    );

    const data = response.data.data;
    if (data.status !== "success") {
      return res.status(400).json({ error: "Transaction not successful" });
    }

    // At this point, the transaction was successful.
    // Extract the amount (in NGN, for example) that the user deposited.
    // Note: Paystack returns amount in kobo, so convert it back to NGN.
    const depositedAmount = data.amount / 100;

    // Convert fiat to credits based on your conversion rate
    const conversionRate = parseFloat(process.env.CREDIT_CONVERSION_RATE) || 10;
    const credits = depositedAmount * conversionRate;

    // Here, determine the user to credit.
    // If you stored the user info in the transaction, use that.
    // For example, let's assume the user's email is unique and we can find them:
    const userEmail = data.customer.email;
    // Find the user's wallet
    const wallet = await Wallet.findOne({ email: userEmail }); // Adjust if Wallet model uses user reference instead
    if (!wallet) {
      return res.status(404).json({ error: "User wallet not found" });
    }

    // Update the wallet balance (adding credits)
    wallet.balance += credits;
    await wallet.save();

    // Optionally, update the transaction record to 'completed'
    // await Transaction.findOneAndUpdate({ reference }, { status: "completed" });

    // Respond back (in a real app you might redirect to a confirmation page)
    res.json({
      message: "Transaction verified and wallet credited",
      depositedAmount,
      credits,
      walletBalance: wallet.balance,
    });
  } catch (error) {
    console.error(
      "Error verifying transaction:",
      error.response ? error.response.data : error.message
    );
    res.status(500).json({ error: "Failed to verify transaction" });
  }
};

exports.withdrawFunds = async (req, res) => {
  try {
    const { amount, recipientCode } = req.body; // amount in NGN, recipientCode is obtained from Paystack when the user registers their bank details
    const userId = req.user.id; // from authentication middleware

    if (!amount || !recipientCode) {
      return res
        .status(400)
        .json({ error: "Amount and recipient code are required" });
    }

    // Convert amount to kobo (if using NGN)
    const convertedAmount = amount * 100;

    // Optional: Check if user has sufficient funds in your internal wallet (fiat portion)
    const wallet = await Wallet.findOne({ user: userId });
    if (!wallet || wallet.balance < amount) {
      return res.status(400).json({ error: "Insufficient funds in wallet" });
    }

    // Initiate the transfer via Paystack Transfers API
    const response = await axios.post(
      "https://api.paystack.co/transfer",
      {
        source: "balance", // funds come from your Paystack balance
        amount: convertedAmount,
        recipient: recipientCode,
        reason: "User withdrawal",
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    // If successful, deduct the amount from the user's wallet (assuming immediate withdrawal; alternatively, mark as pending until confirmed)
    wallet.balance -= amount;
    await wallet.save();

    // Optionally, record this withdrawal as a transaction
    await Transaction.create({
      user: userId,
      type: "withdrawal",
      amount,
      status: "initiated",
      reference: response.data.data.reference, // Paystack returns a unique reference for the transfer
    });

    res.json({
      message:
        "Withdrawal initiated successfully. Funds will be credited to your bank account shortly.",
      data: response.data.data,
    });
  } catch (error) {
    console.error(
      "Error initiating withdrawal:",
      error.response ? error.response.data : error.message
    );
    res.status(500).json({ error: "Server error during withdrawal" });
  }
};
