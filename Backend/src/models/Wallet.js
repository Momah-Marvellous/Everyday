const mongoose = require("mongoose");

const WalletSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    balance: {
      type: Number,
      default: 0,
    },
    currency: {
      type: String,
      default: "USD", // or your base fiat currency
    }, // Site currency balance
    forexBalance: {
      type: Map,
      of: Number, // Store different currencies, e.g., { "USD": 100, "EUR": 50 }
      default: {},
    },
    // You can add fields for tracking deposit history, linked bank accounts, etc.
  },
  { timestamps: true }
);

module.exports = mongoose.model("Wallet", WalletSchema);
