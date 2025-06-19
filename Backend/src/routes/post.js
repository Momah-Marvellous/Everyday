const express = require("express");
const { verifyToken } = require("../middlewares/authMiddleware");
const upload = require("../middlewares/upload");
const {
  createPost,
  deletePost,
  getAllPosts,
  getPost,
  getPostById,
  getPostsByUser,
  likePost,
  updatePost,
} = require("../controllers/postController");

const router = express.Router();

router.post(
  "/posts/create-post",
  verifyToken,
  upload.single("image"),
  createPost
);
router.get("/", verifyToken, getAllPosts);
router.get("/posts/post/:id", verifyToken, getPost);
router.get("/posts/user/:id", verifyToken, getPostsByUser);
router.delete("/posts/post/:id", verifyToken, deletePost);
router.get("/posts/post/:id", verifyToken, getPostById);
router.put("/posts/post/:id/like", verifyToken, likePost);
router.put("/posts/post/:id/update", verifyToken, updatePost);

module.exports = router;
