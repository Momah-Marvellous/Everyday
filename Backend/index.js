const express = require("express");
const path = require("path");
const morgan = require("morgan");
const mongoose = require("mongoose");
const http = require("http");
const socketIo = require("socket.io");
const cors = require("cors");
require("./src/utils/tradeMonitor");
require("dotenv").config();
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");

// Define a rate limiter: e.g., maximum 100 requests per 15 minutes per IP
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: "Too many requests from this IP, please try again after 15 minutes.",
});

const app = express();
app.use(morgan("combined"));

// Apply the rate limiter to all requests
app.use(limiter);

// app.use(
//   helmet.contentSecurityPolicy({
//     directives: {
//       defaultSrc: ["'self'"],
//       scriptSrc: ["'self'"],
//       styleSrc: ["'self'"],
//       imgSrc: ["'self'", "data:"],
//       connectSrc: ["'self'"],
//     },
//   })
// );

// Middleware
app.use(cors());
app.use(express.json());

// Create HTTP server and initialize Socket.io
const server = http.createServer(app);
const io = socketIo(server, {
  cors: { origin: "http://localhost:3000" },
});

// Make io accessible in request objects
app.set("io", io);

// When a client connects
io.on("connection", (socket) => {
  console.log("New client connected", socket.id);

  // Client should send its userId to join a room named after that user
  socket.on("join", (userId) => {
    socket.join(userId);
    console.log(`Socket ${socket.id} joined room ${userId}`);
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected", socket.id);
  });
});

// Serve static files from the "uploads" directory (for movies, chat media, etc.)
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Mount routes
const authRoutes = require("./src/routes/auth");
const postRoutes = require("./src/routes/post");
const adminDashboardRoutes = require("./src/routes/admin");
const bookmarkRoutes = require("./src/routes/bookmark");
const chatRoutes = require("./src/routes/chat");
const commentRoutes = require("./src/routes/comment");
const forexRoutes = require("./src/routes/forex");
const notificationRoutes = require("./src/routes/notification");
const orderRoutes = require("./src/routes/order");
const passwordRoutes = require("./src/routes/password");
const productRoutes = require("./src/routes/product");
const shareRoutes = require("./src/routes/share");
const spotifyRoutes = require("./src/routes/spotify");
// const tmdbRoutes = require("./src/routes/tmdbRoutes");
const paystackRecipientRoutes = require("./src/routes/paystackRecipient");
const paystackRoutes = require("./src/routes/paystack");
const walletRoutes = require("./src/routes/wallet");
const userRoutes = require("./src/routes/user");
const paystackWebhookRoutes = require("./src/routes/paystackWebhook");
const cjRoutes = require("./src/routes/cj");
const youtubeRoutes = require("./src/routes/youtube");

app.use("/api/auth", authRoutes);
app.use("/api/cj", cjRoutes);
app.use("/api/post", postRoutes);
app.use("/api/paystack", paystackWebhookRoutes);
app.use("/api/paystack", paystackRecipientRoutes);
app.use("/api/admin/dashboard", adminDashboardRoutes);
app.use("/api/bookmarks", bookmarkRoutes);
app.use("/api/paystack", paystackRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/comments", commentRoutes);
app.use("/api/forex", forexRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/password", passwordRoutes);
app.use("/api/products", productRoutes);
app.use("/api/shares", shareRoutes);
app.use("/api/spotify", spotifyRoutes);
// app.use("/api/tmdb", tmdbRoutes);
app.use("/api/users", userRoutes);
app.use("/api/youtube", youtubeRoutes);
app.use("/api/wallet", walletRoutes); // Wallet operations

// Start the server
const PORT = process.env.PORT;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));

// Connect to MongoDB
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("MongoDB connection error:", err));

// Test Route
app.get("/", (req, res) => res.send("API is running"));
