const crypto = require("crypto");
const Transaction = require("../models/Transaction");
const Wallet = require("../models/Wallet");

exports.handleWebhook = async (req, res) => {
  try {
    // Paystack sends the signature in the x-paystack-signature header.
    const hash = req.headers["x-paystack-signature"];
    const secret = process.env.PAYSTACK_SECRET_KEY;

    // Compute our hash using the raw body. Ensure the request body is not parsed (use express.raw() in the route).
    const calculatedHash = crypto
      .createHmac("sha512", secret)
      .update(req.body) // req.body here is a Buffer
      .digest("hex");

    if (hash !== calculatedHash) {
      return res.status(401).send("Invalid signature");
    }

    // Parse the JSON body (since we're receiving a Buffer)
    const event = JSON.parse(req.body.toString());

    // Example: Process different Paystack events
    if (event.event === "transfer.success") {
      const reference = event.data.reference;
      // Update the corresponding transaction to 'completed'
      await Transaction.findOneAndUpdate(
        { reference },
        { status: "completed" }
      );

      // Optionally update wallet or log the transfer event
      console.log(`Transfer successful for reference: ${reference}`);
    } else if (event.event === "transfer.failed") {
      const reference = event.data.reference;
      await Transaction.findOneAndUpdate({ reference }, { status: "failed" });
      console.log(`Transfer failed for reference: ${reference}`);
    } else if (event.event === "charge.success") {
      const reference = event.data.reference;
      await Transaction.findOneAndUpdate(
        { reference },
        { status: "completed" }
      );
      console.log(`Charge successful for reference: ${reference}`);
    }

    // Respond to Paystack to acknowledge receipt of the webhook event
    res.status(200).send("Webhook received");
  } catch (error) {
    console.error("Error handling webhook:", error);
    res.status(500).send("Server error");
  }
};
