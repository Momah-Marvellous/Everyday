const Bookmark = require("../models/Bookmark");
const Post = require("../models/Post");

// Bookmark a post
exports.bookmarkPost = async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.user.id;

    // Check if the post exists
    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ error: "Post not found" });

    // Check if the user already bookmarked this post
    const existingBookmark = await Bookmark.findOne({ postId, userId });
    if (existingBookmark) {
      return res.status(400).json({ error: "Post already bookmarked" });
    }

    // Create a new bookmark entry
    const newBookmark = new Bookmark({ postId, userId });
    await newBookmark.save();

    res
      .status(201)
      .json({ message: "Post bookmarked successfully", bookmark: newBookmark });
  } catch (error) {
    console.error("Error bookmarking post:", error);
    res.status(500).json({ error: "Server error" });
  }
};

// Remove a bookmark
exports.removeBookmark = async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.user.id;

    const bookmark = await Bookmark.findOneAndDelete({ postId, userId });
    if (!bookmark) return res.status(404).json({ error: "Bookmark not found" });

    res.json({ message: "Bookmark removed successfully" });
  } catch (error) {
    console.error("Error removing bookmark:", error);
    res.status(500).json({ error: "Server error" });
  }
};

// Get all bookmarks of a user
exports.getUserBookmarks = async (req, res) => {
  try {
    const userId = req.user.id;
    const bookmarks = await Bookmark.find({ userId })
      .populate("postId")
      .sort({ createdAt: -1 });

    res.json(bookmarks);
  } catch (error) {
    console.error("Error fetching bookmarks:", error);
    res.status(500).json({ error: "Server error" });
  }
};
