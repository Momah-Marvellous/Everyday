const Wallet = require("../models/Wallet");

// Create a wallet for the authenticated user
exports.createWallet = async (req, res) => {
  try {
    const userId = req.user.id;

    // Check if a wallet already exists for the user
    const existingWallet = await Wallet.findOne({ user: userId });
    if (existingWallet) {
      return res
        .status(400)
        .json({ error: "Wallet already exists for this user." });
    }

    // Create a new wallet with a default balance of 0
    const wallet = new Wallet({ user: userId, balance: 0 });
    await wallet.save();

    res.status(201).json({ message: "Wallet created successfully", wallet });
  } catch (error) {
    console.error("Error creating wallet:", error);
    res.status(500).json({ error: "Server error" });
  }
};

// Retrieve the wallet for the authenticated user
exports.getWallet = async (req, res) => {
  try {
    const userId = req.user.id;
    const wallet = await Wallet.findOne({ user: userId });
    if (!wallet) {
      return res.status(404).json({ error: "Wallet not found" });
    }
    res.json(wallet);
  } catch (error) {
    console.error("Error fetching wallet:", error);
    res.status(500).json({ error: "Server error" });
  }
};

// Deposit funds into the authenticated user's wallet
exports.deposit = async (req, res) => {
  try {
    const userId = req.user.id;
    const { amount } = req.body;
    if (!amount || amount <= 0) {
      return res.status(400).json({ error: "Invalid deposit amount" });
    }
    const wallet = await Wallet.findOne({ user: userId });
    if (!wallet) {
      return res.status(404).json({ error: "Wallet not found" });
    }
    wallet.balance += amount;
    await wallet.save();
    res.json({ message: "Deposit successful", wallet });
  } catch (error) {
    console.error("Error during deposit:", error);
    res.status(500).json({ error: "Server error" });
  }
};

// Withdraw funds from the authenticated user's wallet
exports.withdraw = async (req, res) => {
  try {
    const userId = req.user.id;
    const { amount } = req.body;
    if (!amount || amount <= 0) {
      return res.status(400).json({ error: "Invalid withdrawal amount" });
    }
    const wallet = await Wallet.findOne({ user: userId });
    if (!wallet) {
      return res.status(404).json({ error: "Wallet not found" });
    }
    if (wallet.balance < amount) {
      return res.status(400).json({ error: "Insufficient funds" });
    }
    wallet.balance -= amount;
    await wallet.save();
    res.json({ message: "Withdrawal successful", wallet });
  } catch (error) {
    console.error("Error during withdrawal:", error);
    res.status(500).json({ error: "Server error" });
  }
};

// Transfer funds from the authenticated user's wallet to another user's wallet
exports.transfer = async (req, res) => {
  try {
    const senderId = req.user.id;
    const { recipientId, amount } = req.body;
    if (!recipientId || !amount || amount <= 0) {
      return res
        .status(400)
        .json({ error: "Recipient and valid amount are required" });
    }

    // Retrieve sender's wallet
    const senderWallet = await Wallet.findOne({ user: senderId });
    if (!senderWallet) {
      return res.status(404).json({ error: "Sender wallet not found" });
    }
    if (senderWallet.balance < amount) {
      return res
        .status(400)
        .json({ error: "Insufficient funds in sender wallet" });
    }

    // Retrieve recipient's wallet
    const recipientWallet = await Wallet.findOne({ user: recipientId });
    if (!recipientWallet) {
      return res.status(404).json({ error: "Recipient wallet not found" });
    }

    // Perform the transfer
    senderWallet.balance -= amount;
    recipientWallet.balance += amount;
    await senderWallet.save();
    await recipientWallet.save();

    res.json({ message: "Transfer successful", senderWallet, recipientWallet });
  } catch (error) {
    console.error("Error during transfer:", error);
    res.status(500).json({ error: "Server error" });
  }
};
