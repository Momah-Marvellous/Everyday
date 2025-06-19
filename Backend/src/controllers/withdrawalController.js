const Wallet = require("../models/Wallet");
const Transaction = require("../models/Transaction");
const WithdrawalRequest = require("../models/WithdrawalRequest");

// Define your conversion rate (e.g., 10 credits = 1 USD)
const conversionRate = 10;

exports.processWithdrawal = async (req, res) => {
  // Expected fields: userId, creditsAmount, bankDetails
  const { userId, creditsAmount, bankDetails } = req.body;

  try {
    // Fetch the user's wallet
    const wallet = await Wallet.findOne({ user: userId });
    if (!wallet) {
      return res.status(404).json({ error: "Wallet not found" });
    }

    // Check if the user has enough credits
    if (wallet.balance < creditsAmount) {
      return res.status(400).json({ error: "Insufficient balance" });
    }

    // Convert credits to fiat money
    const fiatAmount = creditsAmount / conversionRate;

    // Deduct credits from wallet
    wallet.balance -= creditsAmount;
    await wallet.save();

    // Log the withdrawal transaction
    const transaction = await Transaction.create({
      from: userId,
      type: "withdrawal",
      amount: creditsAmount,
      fiatAmount,
      status: "completed",
      details: `Withdrew ${creditsAmount} Credits (${fiatAmount} USD)`,
    });

    // Create a withdrawal request record
    const withdrawalRequest = await WithdrawalRequest.create({
      user: userId,
      creditsAmount,
      fiatAmount,
      bankDetails,
      status: "pending",
      details: "Awaiting processing",
    });

    // In a real system, you would trigger the actual transfer here.

    res.status(200).json({
      message: "Withdrawal request submitted successfully",
      withdrawalRequest,
      transaction,
    });
  } catch (error) {
    console.error("Withdrawal error:", error);
    res.status(500).json({ error: "Withdrawal failed" });
  }
};
