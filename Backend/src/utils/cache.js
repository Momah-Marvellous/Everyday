const redis = require("redis");
const client = redis.createClient({
  url: process.env.REDIS_URL || "redis://localhost:6379",
});

// Connect to Redis
client.connect().catch(console.error);

const cacheMiddleware = (req, res, next) => {
  const key = req.originalUrl;

  client.get(key, (err, data) => {
    if (err) {
      console.error("Redis error:", err);
      return next(); // proceed without cache on error
    }
    if (data != null) {
      return res.json(JSON.parse(data));
    } else {
      // Override res.json to cache the response
      res.sendResponse = res.json;
      res.json = (body) => {
        client.setEx(key, 3600, JSON.stringify(body)); // Cache for 1 hour
        res.sendResponse(body);
      };
      next();
    }
  });
};

module.exports = cacheMiddleware;
