const Wallet = require("../models/Wallet");
const ForexTrade = require("../models/ForexTrade");
const getExchangeRate = require("../utils/forexApi");

const TRADING_FEE_PERCENTAGE = 0.01; // 1% fee

// Buy forex: deduct from fiat balance, add to forex balance
exports.buyForex = async (req, res) => {
  try {
    const { currencyPair, amount, stopLoss, takeProfit } = req.body;
    const userId = req.user.id;

    const exchangeRate = await getExchangeRate(currencyPair);
    if (!exchangeRate)
      return res
        .status(400)
        .json({ error: "Invalid currency pair or rate unavailable" });

    // Calculate cost in fiat currency
    const cost = amount * exchangeRate;
    const fee = cost * TRADING_FEE_PERCENTAGE;
    const finalCost = cost + fee;

    // Retrieve user's wallet
    const wallet = await Wallet.findOne({ user: userId });
    if (!wallet || wallet.balance < finalCost)
      return res.status(400).json({ error: "Insufficient fiat balance" });

    // Deduct from fiat balance
    wallet.balance -= finalCost;
    // Update forex balance; use the target currency from the pair (e.g., "USD" from "EUR/USD")
    const targetCurrency = currencyPair.split("/")[1];
    const currentForexBalance = wallet.forexBalance.get(targetCurrency) || 0;
    wallet.forexBalance.set(targetCurrency, currentForexBalance + amount);
    await wallet.save();

    // Record the forex trade
    await ForexTrade.create({
      user: userId,
      type: "buy",
      currencyPair,
      amount,
      price: exchangeRate,
      totalCost: finalCost,
      fee,
      stopLoss: stopLoss || null,
      takeProfit: takeProfit || null,
      status: "pending", // Mark as pending until monitored
    });

    res.json({ message: "Forex purchase successful", balance: wallet.balance });
  } catch (error) {
    console.error("Error buying forex:", error);
    res.status(500).json({ error: "Server error" });
  }
};

// Sell forex: deduct from forex balance, credit fiat balance
exports.sellForex = async (req, res) => {
  try {
    const { currencyPair, amount } = req.body;
    const userId = req.user.id;

    const exchangeRate = await getExchangeRate(currencyPair);
    if (!exchangeRate)
      return res
        .status(400)
        .json({ error: "Invalid currency pair or rate unavailable" });

    const targetCurrency = currencyPair.split("/")[1];
    const wallet = await Wallet.findOne({ user: userId });
    const availableForex = wallet.forexBalance.get(targetCurrency) || 0;
    if (availableForex < amount)
      return res.status(400).json({ error: "Insufficient forex balance" });

    const totalValue = amount * exchangeRate;
    // Deduct forex balance and credit fiat balance
    wallet.forexBalance.set(targetCurrency, availableForex - amount);
    wallet.balance += totalValue;
    await wallet.save();

    // Record the forex trade
    await ForexTrade.create({
      user: userId,
      type: "sell",
      currencyPair,
      amount,
      price: exchangeRate,
      totalCost: totalValue,
      status: "completed",
    });

    res.json({ message: "Forex sale successful", balance: wallet.balance });
  } catch (error) {
    console.error("Error selling forex:", error);
    res.status(500).json({ error: "Server error" });
  }
};

// Get trade history for the current user
exports.getTradeHistory = async (req, res) => {
  try {
    const userId = req.user.id;
    const trades = await ForexTrade.find({ user: userId }).sort({
      createdAt: -1,
    });
    res.json(trades);
  } catch (error) {
    console.error("Error fetching trade history:", error);
    res.status(500).json({ error: "Server error" });
  }
};
