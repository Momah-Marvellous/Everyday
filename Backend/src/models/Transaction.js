const mongoose = require("mongoose");

const TransactionSchema = new mongoose.Schema(
  {
    from: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    to: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    type: {
      type: String,
      enum: [
        "deposit",
        "withdrawal",
        "transfer",
        "purchase",
        "sale",
        "forex_trade",
      ],
      required: true,
    },
    creditAmount: {
      type: Number,
      required: true,
    },
    fiatAmount: {
      type: Number, // This field is optional and used only for deposit/withdrawal transactions
    },
    currency: {
      type: String,
      default: "CREDITS",
    },
    status: {
      type: String,
      enum: ["pending", "completed", "failed"],
      default: "pending",
    },
    details: {
      type: String,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Transaction", TransactionSchema);
