const mongoose = require("mongoose");

const VideoSchema = new mongoose.Schema(
  {
    videoId: { type: String, required: true },
    title: { type: String, required: true },
    url: { type: String, required: true }, // Path to the downloaded file
    format: { type: String, enum: ["video", "audio"], required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Video", VideoSchema);
