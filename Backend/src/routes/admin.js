const express = require("express");
const router = express.Router();
const { verifyToken, adminOnly } = require("../middlewares/authMiddleware");
const upload = require("../middlewares/upload");

const {
  updateUserStatus,
  getAllReports,
  exportUsersCSV,
  exportTransactionsCSV,
  getTransactionAnalytics,
  getAllForexTrades,
  getDashboardData,
  getUsersDetails,
  uploadMovie,
  getAllUsers,
  deleteUser,
} = require("../controllers/adminController");

router.post(
  "/upload",
  verifyToken,
  adminOnly,
  upload.single("movieFile"),
  uploadMovie
);

router.put("/users/status", verifyToken, adminOnly, updateUserStatus);

router.get("/reports", verifyToken, adminOnly, getAllReports);

router.get("/export/users", verifyToken, adminOnly, exportUsersCSV);

router.get(
  "/export/transactions",
  verifyToken,
  adminOnly,
  exportTransactionsCSV
);

router.get(
  "/analytics/transactions",
  verifyToken,
  adminOnly,
  getTransactionAnalytics
);

router.get("/dashboard", verifyToken, adminOnly, getDashboardData);

router.get("/users/details", verifyToken, adminOnly, getUsersDetails);

router.get("/users", verifyToken, adminOnly, getAllUsers);

router.delete("/user/:id", verifyToken, adminOnly, deleteUser);

router.get("/trades", verifyToken, adminOnly, getAllForexTrades);

module.exports = router;
