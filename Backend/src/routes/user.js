const express = require("express");
const router = express.Router();
const upload = require("../middlewares/upload");
const User = require("../models/User");
const {
  searchUsers,
  sendFriendRequest,
  acceptFriendRequest,
  rejectFriendRequest,
} = require("../controllers/socialController");
const { verifyToken } = require("../middlewares/authMiddleware");
const {
  getProfile,
  updateProfile,
  updateProfilePicture,
} = require("../controllers/userController");

router.get("/search", verifyToken, searchUsers);

router.get("/profile", verifyToken, getProfile);

router.put("/profile", verifyToken, updateProfile);

router.post("/friend-request", verifyToken, sendFriendRequest);

router.post("/accept-friend", verifyToken, acceptFriendRequest);

router.post("/reject-friend", verifyToken, rejectFriendRequest);

router.put(
  "/profile-picture",
  verifyToken,
  upload.single("profilePicture"),
  updateProfilePicture
);

module.exports = router;
