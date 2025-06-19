const express = require("express");
const {
  sharePost,
  getShares,
  getUserShares,
} = require("../controllers/shareController");
const { verifyToken } = require("../middlewares/authMiddleware");

const router = express.Router();

router.post("/:postId", verifyToken, sharePost);
router.get("/:postId", getShares);
router.get("/user/shared", verifyToken, getUserShares);

module.exports = router;
