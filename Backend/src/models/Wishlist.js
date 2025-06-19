const mongoose = require("mongoose");

const WishlistItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: true,
  },
  addedAt: {
    type: Date,
    default: Date.now,
  },
});

const WishlistSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true, // each user has one wishlist
    },
    items: [WishlistItemSchema],
    // Sharing options for the wishlist
    isPublic: {
      type: Boolean,
      default: false, // if true, others can view/share this wishlist
    },
    shareCount: {
      type: Number,
      default: 0, // track how many times the wishlist has been shared
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Wishlist", WishlistSchema);
