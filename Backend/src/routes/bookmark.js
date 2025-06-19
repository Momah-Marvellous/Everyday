const express = require("express");
const {
  bookmarkPost,
  removeBookmark,
  getUserBookmarks,
} = require("../controllers/bookmarkController");
const { verifyToken } = require("../middlewares/authMiddleware");

const router = express.Router();

router.post("/:postId", verifyToken, bookmarkPost);
router.delete("/:postId", verifyToken, removeBookmark);
router.get("/user/bookmarks", verifyToken, getUserBookmarks);

module.exports = router;
