const express = require("express");
const router = express.Router();
const cacheMiddleware = require("../utils/cache");

// Example: Apply caching to a GET route
router.get("/some-data", cacheMiddleware, async (req, res) => {
  // ... fetch data from the database or external API ...
  res.json({ data: "This is some data" });
});

module.exports = router;
