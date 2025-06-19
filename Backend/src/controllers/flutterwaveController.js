const axios = require("axios");
const { v4: uuidv4 } = require("uuid");
const Wallet = require("../models/Wallet");
const Transaction = require("../models/Transaction");

// Define your conversion rate (e.g., 10 credits = 1 USD)
const conversionRate = 10; // Adjust as needed

/**
 * Initiates a deposit by creating a Flutterwave payment link.
 */
exports.initiateDeposit = async (req, res) => {
  // Expected fields in req.body: userId, amount, email, name
  const { userId, amount, email, name } = req.body;

  // Generate a unique transaction reference
  const tx_ref = `TX-${uuidv4()}`;

  const payload = {
    tx_ref,
    amount, // Amount in fiat (e.g., USD)
    currency: "USD", // Adjust if necessary
    redirect_url: `${process.env.BASE_URL}/api/flutterwave/callback`, // Endpoint to handle verification
    customer: {
      email,
      name,
    },
    customizations: {
      title: "Deposit Credits",
      description: "Depositing funds to convert to credits",
    },
  };

  try {
    const response = await axios.post(
      "https://api.flutterwave.com/v3/payments",
      payload,
      {
        headers: {
          Authorization: `Bearer ${process.env.FLUTTERWAVE_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );
    // Return the payment link to the frontend
    res.status(200).json({ paymentLink: response.data.data.link });
  } catch (error) {
    console.error(
      "Error initiating deposit with Flutterwave:",
      error.response?.data || error
    );
    res.status(500).json({ error: "Could not initiate deposit" });
  }
};

/**
 * Verifies a Flutterwave transaction after payment.
 * This can be called as a callback or manually via a frontend trigger.
 */
exports.verifyTransaction = async (req, res) => {
  // Flutterwave typically sends tx_ref and transaction_id in the query parameters
  const { tx_ref, transaction_id } = req.query;

  try {
    const response = await axios.get(
      `https://api.flutterwave.com/v3/transactions/${transaction_id}/verify`,
      {
        headers: {
          Authorization: `Bearer ${process.env.FLUTTERWAVE_SECRET_KEY}`,
        },
      }
    );

    // Check if the transaction was successful
    if (response.data.data.status === "successful") {
      const amount = response.data.data.amount; // Amount in fiat (e.g., USD)
      const credits = amount * conversionRate; // Convert fiat to credits

      // Update the user's wallet here.
      // For this example, we assume the userId is included in a custom field or handled separately.
      // You might need to map tx_ref to a stored deposit request that contains the userId.
      // Example (pseudo-code):
      // const wallet = await Wallet.findOne({ user: storedUserId });
      // wallet.balance += credits;
      // await wallet.save();

      // Log the deposit transaction
      const transaction = await Transaction.create({
        to: /* storedUserId */ userId,
        type: "deposit",
        amount: credits,
        fiatAmount: amount,
        status: "completed",
        details: `Converted ${amount} USD to ${credits} Credits`,
      });

      // Respond to Flutterwave callback or frontend
      res
        .status(200)
        .json({
          message: "Deposit verified successfully",
          credits,
          transaction,
        });
    } else {
      res.status(400).json({ error: "Transaction not successful" });
    }
  } catch (error) {
    console.error(
      "Error verifying Flutterwave transaction:",
      error.response?.data || error
    );
    res.status(500).json({ error: "Transaction verification failed" });
  }
};
