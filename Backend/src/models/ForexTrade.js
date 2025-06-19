const mongoose = require("mongoose");

const ForexTradeSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    currencyPair: {
      type: String,
      required: true, // e.g., "EUR/USD"
    },
    tradeType: {
      type: String,
      enum: ["buy", "sell"],
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    price: {
      type: Number,
      required: true, // The price at which the trade is executed
    },
    stopLoss: { type: Number, default: null },
    takeProfit: { type: Number, default: null },
    status: {
      type: String,
      enum: ["open", "closed", "cancelled"],
      default: "open",
    },
    executedAt: Date,
  },
  { timestamps: true }
);

module.exports = mongoose.model("ForexTrade", ForexTradeSchema);
