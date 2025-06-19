// models/Media.js
const mongoose = require("mongoose");

const MediaSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["movie", "anime", "music", "reel"],
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    description: String,
    // URL/path for the media file
    mediaUrl: {
      type: String,
      required: true,
    },
    // Optional thumbnail URL
    thumbnailUrl: String,
    // Duration in seconds (if applicable)
    duration: Number,
  },
  { timestamps: true }
);

module.exports = mongoose.model("Media", MediaSchema);
