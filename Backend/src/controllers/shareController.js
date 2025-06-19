const Share = require("../models/Share");
const Post = require("../models/Post");

// Share a post
exports.sharePost = async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.user.id;

    // Check if the post exists
    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ error: "Post not found" });

    // // Check if the user already shared this post
    // const existingShare = await Share.findOne({ postId, sharedBy: userId });
    // if (existingShare) {
    //   return res
    //     .status(400)
    //     .json({ error: "You have already shared this post" });
    // }

    // Create a new share entry
    const newShare = new Share({ postId, sharedBy: userId });
    post.shareCount += 1;
    await newShare.save();
    await post.save();

    res
      .status(201)
      .json({ message: "Post shared successfully", share: newShare });
  } catch (error) {
    console.error("Error sharing post:", error);
    res.status(500).json({ error: "Server error" });
  }
};

// Get all shares of a post
exports.getShares = async (req, res) => {
  try {
    const { postId } = req.params;
    const shares = await Share.find({ postId })
      .populate("sharedBy", "username profilePicture")
      .sort({ createdAt: -1 });

    res.json(shares);
  } catch (error) {
    console.error("Error fetching shares:", error);
    res.status(500).json({ error: "Server error" });
  }
};

// Get all posts shared by a user
exports.getUserShares = async (req, res) => {
  try {
    const userId = req.user.id;
    const shares = await Share.find({ sharedBy: userId })
      .populate("postId")
      .sort({ createdAt: -1 });

    res.json(shares);
  } catch (error) {
    console.error("Error fetching shared posts:", error);
    res.status(500).json({ error: "Server error" });
  }
};
