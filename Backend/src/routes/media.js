const express = require("express");
const router = express.Router();
const path = require("path");
const fs = require("fs");
const { verifyToken } = require("../middleware/auth");

router.get("/download/:filename", verifyToken, (req, res) => {
  const { filename } = req.params;
  // Construct the full path to the file
  const filePath = path.join(__dirname, "../uploads", filename);

  // Check if the file exists
  fs.access(filePath, fs.constants.F_OK, (err) => {
    if (err) {
      return res.status(404).json({ error: "File not found." });
    }

    // Serve the file as a download
    res.download(filePath, filename, (err) => {
      if (err) {
        console.error("Error during download:", err);
      } else {
        console.log(`File ${filename} was downloaded successfully.`);

        // Optional: Delete the file after successful download
        // Uncomment the lines below if you want to remove the file after download.
        // fs.unlink(filePath, (unlinkErr) => {
        //   if (unlinkErr) {
        //     console.error('Error deleting file after download:', unlinkErr);
        //   } else {
        //     console.log(`File ${filename} deleted after download.`);
        //   }
        // });
      }
    });
  });
});

module.exports = router;
