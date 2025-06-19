const axios = require("axios");
// Optionally, import your Order model if you want to record the order locally
const Order = require("../models/Order");

const CJ_API_KEY = process.env.CJ_API_KEY;
const CJ_API_URL = process.env.CJ_API_URL;

exports.createCJOrder = async (req, res) => {
  try {
    // Extract order details from the request body
    const {
      productId,
      quantity,
      customerName,
      customerAddress,
      customerPhone,
      customerEmail,
    } = req.body;

    if (
      !productId ||
      !quantity ||
      !customerName ||
      !customerAddress ||
      !customerPhone
    ) {
      return res.status(400).json({ error: "Missing required order details." });
    }

    // Construct the payload according to CJ Dropshipping API specifications
    const payload = {
      apiKey: CJ_API_KEY,
      productId,
      quantity,
      customer: {
        name: customerName,
        address: customerAddress,
        phone: customerPhone,
        email: customerEmail, // Optional if required by the API
      },
      shipping: {
        method: "door-to-door", // Specify door-to-door shipping; adjust if needed
      },
    };

    // Make the API request to create the order
    const response = await axios.post(`${CJ_API_URL}/order/create`, payload, {
      headers: { "Content-Type": "application/json" },
    });

    // Check for success based on the response structure
    if (response.data && response.data.success) {
      // Optionally record the order locally in your database
      // const newOrder = new Order({ ...payload, reference: response.data.order.reference });
      // await newOrder.save();

      return res.json({
        message: "Order placed successfully",
        order: response.data.order,
      });
    } else {
      return res.status(400).json({
        error: "Order creation failed",
        details: response.data,
      });
    }
  } catch (error) {
    console.error(
      "Error creating CJ order:",
      error.response ? error.response.data : error.message
    );
    res.status(500).json({ error: "Server error during order creation" });
  }
};

exports.importProducts = async (req, res) => {
  try {
    // Hypothetical endpoint for product listing from CJ Dropshipping.
    // You must refer to CJ's documentation for the actual endpoint and query parameters.
    const response = await axios.get(`${CJ_API_URL}/product`, {
      headers: {
        Authorization: `Bearer ${CJ_API_KEY}`,
        "Content-Type": "application/json",
      },
      // You might need to pass query parameters if required, e.g.:
      // params: { category: req.query.category }
    });

    // Optionally transform the data as needed before sending it to the frontend.
    const products = response.data;
    res.json(products);
  } catch (error) {
    console.error(
      "Error importing products from CJ:",
      error.response ? error.response.data : error.message
    );
    res.status(500).json({ error: "Server error while importing products" });
  }
};
