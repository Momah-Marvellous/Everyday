const express = require("express");
const router = express.Router();
const {
  searchVideos,
  downloadVideo,
} = require("../controllers/youtubeController");

// Endpoint to search for videos using a query parameter "q"
// Example: GET /api/youtube/search?q=Inception
router.get("/search", searchVideos);

router.post("/download", downloadVideo);

module.exports = router;
