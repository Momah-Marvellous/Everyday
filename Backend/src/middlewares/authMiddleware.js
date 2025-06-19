const jwt = require("jsonwebtoken");
const logger = require("../utils/logger");

function verifyToken(req, res, next) {
  // Get the Authorization header
  const authHeader = req.headers.authorization;

  // Ensure authHeader exists and is a string
  if (!authHeader || typeof authHeader !== "string") {
    return res.status(401).json({ error: "No token provided." });
  }

  // Split the header. It should be in the format "Bearer <token>"
  const token = authHeader.split(" ")[1];
  if (!token) {
    return res.status(401).json({ error: "Token not found in header." });
  }

  // Verify token using JWT_SECRET
  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      logger.error("JWT verification error:", err);
      return res.status(401).json({ error: "Invalid token." });
    }
    req.user = decoded;
    next();
  });
}

// Middleware to restrict access to admins only
const adminOnly = (req, res, next) => {
  if (req.user && req.user.role === "admin") {
    return next();
  }
  return res.status(403).json({ message: "Admin access required." });
};

module.exports = { verifyToken, adminOnly };
