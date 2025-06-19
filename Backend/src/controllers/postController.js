const Post = require("../models/Post");
const Like = require("../models/Like");
const User = require("../models/User");
const logger = require("../utils/logger");

// Create a new post
exports.createPost = async (req, res) => {
  try {
    // Assume that the authentication middleware sets req.user with the authenticated user's info.
    const userId = req.user && req.user.id;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    const { content } = req.body;
    if (!content) {
      return res.status(400).json({ error: "Content is required." });
    }
    let imageUrl = null;
    if (req.file) {
      // For local storage, you might serve files from your "uploads" directory
      // For production, consider using a CDN or cloud storage (S3, etc.)
      imageUrl = `../uploads/${req.file.filename}`;
    }
    const newPost = await Post.create({
      author: userId,
      content,
      imageUrl,
    });
    res.status(201).json(newPost);
  } catch (error) {
    logger.error("Error creating post:", error);
    res.status(500).json({ error: "Server error" });
  }
};

// Get all posts (e.g., for a feed)
exports.getAllPosts = async (req, res) => {
  try {
    const posts = await Post.find({
      include: [
        {
          model: User,
          attributes: ["username", "profilePicture"], // choose which fields you want
        },
      ],
    });
    res.json(posts);
  } catch (error) {
    logger.error("Error fetching posts:", error);
    res.status(500).json({ error: "Server error" });
  }
};

exports.getPostsByUser = async (req, res) => {
  try {
    const userId = req.params.id;
    const posts = await Post.find({
      where: { userId },
      order: [["createdAt", "DESC"]],
    });
    res.json(posts);
  } catch (error) {
    logger.error("Error fetching posts by user:", error);
    res.status(500).json({ error: "Server error" });
  }
};

// Get a single post by ID
exports.getPost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }
    res.json(post);
  } catch (error) {
    logger.error("Error fetching post:", error);
    res.status(500).json({ error: "Server error" });
  }
};

exports.getPostById = async (req, res) => {
  const { id } = req.params;
  try {
    const post = await Post.findById(id, {
      include: [
        {
          model: User,
          attributes: ["id", "username", "profilePicture"],
        },
      ],
    });
    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }
    res.json(post);
  } catch (error) {
    logger.error("Error fetching post:", error);
    res.status(500).json({ error: "Server error" });
  }
};

// Like a post (only once per user)
exports.likePost = async (req, res) => {
  try {
    const postId = req.params.id;
    const userId = req.user.id;
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }
    // Check if this user already liked the post
    const existingLike = await Like.findOne({ postId, userId });
    if (existingLike) {
      await Like.deleteOne(existingLike);
      post.likeCount -= 1;
      await post.save();
      return res.json({
        error: "Post Unliked",
        message: post.likeCount,
      });
    }
    await Like.create({ postId, userId });
    post.likeCount += 1;
    await post.save();
    res.json({ message: "Post liked", likeCount: post.likeCount });
  } catch (error) {
    logger.error("Error liking post:", error);
    res.status(500).json({ error: "Server error" });
  }
};

// // Comment on a post
// exports.commentOnPost = async (req, res) => {
//   try {
//     const { postId, content } = req.body;
//     const userId = req.user.id;
//     if (!content) {
//       return res.status(400).json({ error: "Comment content is required." });
//     }
//     const post = await Post.findByPk(postId);
//     if (!post) {
//       return res.status(404).json({ error: "Post not found." });
//     }
//     const newComment = await Comment.create({ postId, userId, content });
//     res.status(201).json({ message: "Comment added", comment: newComment });
//   } catch (error) {
//     logger.error("Error commenting on post:", error);
//     res.status(500).json({ error: "Server error" });
//   }
// };

// // Share a post (increments share count)
// exports.sharePost = async (req, res) => {
//   try {
//     const postId = req.params.id;
//     const post = await Post.findByPk(postId);
//     if (!post) {
//       return res.status(404).json({ error: "Post not found." });
//     }
//     post.shareCount += 1;
//     await post.save();
//     res.json({ message: "Post shared", shareCount: post.shareCount });
//   } catch (error) {
//     logger.error("Error sharing post:", error);
//     res.status(500).json({ error: "Server error" });
//   }
// };

// Update a post (only by its owner)
exports.updatePost = async (req, res) => {
  try {
    const userId = req.user && req.user.id;
    const { content, imageUrl } = req.body;
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }
    // Only the owner can update the post
    if (post.author.toString() !== userId) {
      console.log(post.author.toString(), userId);
      return res
        .status(403)
        .json({ error: "Unauthorized to update this post" });
    }
    post.content = content || post.content;
    post.imageUrl = imageUrl || post.imageUrl;
    await post.save();
    res.json(post);
  } catch (error) {
    logger.error("Error updating post:", error);
    res.status(500).json({ error: "Server error" });
  }
};

// Delete a post (only by its owner)
exports.deletePost = async (req, res) => {
  try {
    const userId = req.user && req.user.id;
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }
    // Only the owner can delete the post
    if (post.author.toString() !== userId) {
      return res
        .status(403)
        .json({ error: "Unauthorized to delete this post" });
    }
    await post.deleteOne();
    res.json({ message: "Post deleted successfully" });
  } catch (error) {
    logger.error("Error deleting post:", error);
    res.status(500).json({ error: "Server error" });
  }
};
