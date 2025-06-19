const express = require("express");
const router = express.Router();
const { searchTracks } = require("../controllers/spotifyController");

// Endpoint to search for tracks on Spotify using a query parameter 'q'
// Example: GET /api/spotify/search?q=Beatles
router.get("/search", searchTracks);

module.exports = router;
