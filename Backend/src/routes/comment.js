const express = require("express");
const {
  addComment,
  editComment,
  deleteComment,
  getComments,
} = require("../controllers/commentController");
const { verifyToken } = require("../middlewares/authMiddleware");

const router = express.Router();

router.post("/:postId", verifyToken, addComment);
router.put("/:commentId", verifyToken, editComment);
router.delete("/:commentId", verifyToken, deleteComment);
router.get("/:postId", getComments);

module.exports = router;
