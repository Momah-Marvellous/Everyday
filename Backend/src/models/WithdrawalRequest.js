const mongoose = require("mongoose");

const WithdrawalRequestSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    creditsAmount: {
      type: Number,
      required: true,
    },
    fiatAmount: {
      type: Number,
      required: true, // Calculated fiat value based on the conversion rate
    },
    currency: {
      type: String,
      default: "USD",
    },
    bankDetails: {
      accountNumber: { type: String, required: true },
      bankName: { type: String, required: true },
      routingNumber: { type: String }, // Optional based on region
      // Alternatively, you can structure bankDetails as a nested object with further fields
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "completed"],
      default: "pending",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("WithdrawalRequest", WithdrawalRequestSchema);
