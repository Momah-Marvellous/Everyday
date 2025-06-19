const Order = require("../models/Order");
const Product = require("../models/Product");

// Create a new order (purchase products)
exports.createOrder = async (req, res) => {
  try {
    const { products } = req.body; // products: [{ productId, quantity }]
    const buyerId = req.user.id;
    let totalPrice = 0;
    let orderItems = []; // Will hold details for each order item

    // Validate each product and calculate the total price
    for (const item of products) {
      const product = await Product.findById(item.productId);
      if (!product) {
        return res
          .status(404)
          .json({ error: `Product not found: ${item.productId}` });
      }
      if (product.stock < item.quantity) {
        return res
          .status(400)
          .json({ error: `Insufficient stock for ${product.name}` });
      }
      const cost = product.price * item.quantity;
      totalPrice += cost;
      orderItems.push({
        product: product._id,
        quantity: item.quantity,
        cost,
        seller: product.seller, // seller ID from the product
      });
    }

    // Retrieve buyer's wallet and check for sufficient funds
    const buyerWallet = await Wallet.findOne({ user: buyerId });
    if (!buyerWallet || buyerWallet.balance < totalPrice) {
      return res
        .status(400)
        .json({ error: "Insufficient funds in buyer's wallet" });
    }

    // Deduct the total order cost from the buyer's wallet
    buyerWallet.balance -= totalPrice;
    await buyerWallet.save();

    // Process each order item: distribute funds between seller and admin
    const adminUserId = process.env.ADMIN_USER_ID; // Ensure this is set in your environment
    for (const item of orderItems) {
      // Credit seller's wallet with 95% of the item's cost
      const sellerWallet = await Wallet.findOne({ user: item.seller });
      if (sellerWallet) {
        const sellerAmount = item.cost * 0.95;
        sellerWallet.balance += sellerAmount;
        await sellerWallet.save();
      }

      // Credit admin's wallet with 5% commission
      const adminWallet = await Wallet.findOne({ user: adminUserId });
      if (adminWallet) {
        const commission = item.cost * 0.05;
        adminWallet.balance += commission;
        await adminWallet.save();
      }
    }

    // Create the order with the collected order items (without cost details)
    const order = new Order({
      buyer: buyerId,
      products: orderItems.map((item) => ({
        product: item.product,
        quantity: item.quantity,
      })),
      totalPrice,
    });
    await order.save();

    // Reduce the stock for each ordered product
    for (const item of products) {
      await Product.findByIdAndUpdate(item.productId, {
        $inc: { stock: -item.quantity },
      });
    }

    res.status(201).json({ message: "Order created successfully", order });
  } catch (error) {
    console.error("Error creating order:", error);
    res.status(500).json({ error: "Server error" });
  }
};

// Get order history for the current user
exports.getOrderHistory = async (req, res) => {
  try {
    const orders = await Order.find({ buyer: req.user.id })
      .populate("products.product", "name price imageUrl")
      .sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    console.error("Error fetching order history:", error);
    res.status(500).json({ error: "Server error" });
  }
};
