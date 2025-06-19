const axios = require("axios");
const ytDlp = require("yt-dlp-exec");
const Video = require("../models/Video");

exports.searchVideos = async (req, res) => {
  try {
    const searchQuery = req.query.q;
    if (!searchQuery) {
      return res
        .status(400)
        .json({ error: "Search query parameter 'q' is required" });
    }

    // Get the YouTube API key from environment variables
    const apiKey = process.env.YOUTUBE_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: "YouTube API key not configured" });
    }

    // Construct the YouTube Data API URL
    const apiUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(
      searchQuery
    )}&type=video&maxResults=10&key=${apiKey}`;

    // Make a GET request to the YouTube API
    const response = await axios.get(apiUrl);

    // Return the data to the client
    res.json(response.data);
  } catch (error) {
    console.error(
      "Error fetching YouTube data:",
      error.response ? error.response.data : error.message
    );
    res.status(500).json({ error: "Server error while fetching YouTube data" });
  }
};

exports.downloadVideo = async (req, res) => {
  try {
    const { videoId, format } = req.body;
    if (!videoId) {
      return res.status(400).json({ error: "Video ID is required" });
    }

    // Construct the YouTube URL using the videoId
    const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;

    // Use yt-dlp-exec to fetch the video title
    const titleOutput = await ytDlp(["--get-title", videoUrl], {
      stdio: "pipe",
    });
    // Sanitize the title for file naming
    const title = titleOutput.trim().replace(/[^a-z0-9]/gi, "_");

    // Build download arguments and determine file extension based on the requested format
    let args;
    let fileExtension;
    if (format === "audio") {
      args = ["-f", "bestaudio", "-o", `downloads/${title}.mp3`, videoUrl];
      fileExtension = "mp3";
    } else {
      args = ["-f", "best", "-o", `downloads/${title}.mp4`, videoUrl];
      fileExtension = "mp4";
    }

    // Download the video/audio using yt-dlp-exec
    const downloadOutput = await ytDlp(args, { stdio: "pipe" });
    console.log("Download complete:", downloadOutput);

    // Construct the file URL based on the format
    const fileUrl = `/downloads/${title}.${fileExtension}`;

    // Save the download details in MongoDB
    const videoData = new Video({
      videoId,
      title,
      url: fileUrl,
      format: format === "audio" ? "audio" : "video",
    });
    await videoData.save();

    res.json({ message: "Download completed", video: videoData });
  } catch (error) {
    console.error("Error in downloadVideo:", error);
    res.status(500).json({ error: "Server error", details: error.toString() });
  }
};
