const Favorite = require("../models/FavoriteSong");
const YTMusic = require("ytmusic-api").YTMusic;
const puppeteer = require("puppeteer");
const ytdl = require("ytdl-core");

exports.initYTMusic = async () => {
  const ytmusic = new YTMusic();
  await ytmusic.initialize(); // Initialize YTMusic API
  return ytmusic;
};

exports.searchMusic = async (req, res) => {
  const { query } = req.query;
  if (!query) return res.status(400).json({ error: "Query is required" });

  try {
    const ytmusic = await initYTMusic();
    const results = await ytmusic.search(query, "songs"); // Search for songs
    res.json(results);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch music" });
  }
};

exports.scrapeYTMusic = async (query, type = "song") => {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  // Go to YouTube Music search results page
  const searchUrl = `https://music.youtube.com/search?q=${encodeURIComponent(
    query
  )}`;
  await page.goto(searchUrl, { waitUntil: "networkidle2" });

  // Wait for search results to load
  await page.waitForSelector("ytmusic-shelf-renderer");

  let results = [];

  if (type === "song") {
    results = await page.evaluate(() => {
      return Array.from(
        document.querySelectorAll("ytmusic-responsive-list-item-renderer")
      ).map((el) => ({
        title:
          el.querySelector("yt-formatted-string")?.innerText || "Unknown Title",
        artist: el.querySelector(".byline")?.innerText || "Unknown Artist",
        link:
          "https://music.youtube.com" +
          (el.querySelector("a")?.getAttribute("href") || ""),
        thumbnail: el.querySelector("img")?.getAttribute("src") || "",
      }));
    });
  } else if (type === "album") {
    results = await page.evaluate(() => {
      return Array.from(
        document.querySelectorAll(
          "ytmusic-grid-renderer ytmusic-two-row-item-renderer"
        )
      ).map((el) => ({
        title: el.querySelector(".title")?.innerText || "Unknown Album",
        artist: el.querySelector(".subtitle")?.innerText || "Unknown Artist",
        link:
          "https://music.youtube.com" +
          (el.querySelector("a")?.getAttribute("href") || ""),
        thumbnail: el.querySelector("img")?.getAttribute("src") || "",
      }));
    });
  } else if (type === "playlist") {
    results = await page.evaluate(() => {
      return Array.from(
        document.querySelectorAll("ytmusic-playlist-shelf-renderer")
      ).map((el) => ({
        title:
          el.querySelector("yt-formatted-string")?.innerText ||
          "Unknown Playlist",
        link:
          "https://music.youtube.com" +
          (el.querySelector("a")?.getAttribute("href") || ""),
        thumbnail: el.querySelector("img")?.getAttribute("src") || "",
      }));
    });
  }

  await browser.close();
  return results;
};

exports.addFavoriteMusic = async (req, res) => {
  const { song } = req.body;
  if (!song) return res.status(400).json({ error: "Song data is required" });

  try {
    const existing = await Favorite.findOne({
      userId: req.userId,
      "song.videoId": song.videoId,
    });
    if (existing)
      return res.status(400).json({ error: "Song is already in favorites" });

    const favorite = new Favorite({ userId: req.userId, song });
    await favorite.save();
    res.json({ message: "Song added to favorites", favorite });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to add favorite" });
  }
};

exports.getFavoriteMusic = async (req, res) => {
  try {
    const favorites = await Favorite.find({ userId: req.userId });
    res.json(favorites);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch favorites" });
  }
};

exports.createMusicPlaylist = async (req, res) => {
  const { name, songs, isPublic } = req.body;
  if (!name)
    return res.status(400).json({ error: "Playlist name is required" });

  try {
    const newPlaylist = new Playlist({
      userId: req.userId,
      name,
      songs,
      isPublic: isPublic || false,
    });
    await newPlaylist.save();
    res.json({
      message: "Playlist created successfully",
      playlist: newPlaylist,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to create playlist" });
  }
};

exports.streamYTMusic = async (req, res) => {
  const videoId = req.params.videoId;
  try {
    const url = `https://www.youtube.com/watch?v=${videoId}`;
    res.setHeader("Content-Type", "audio/mp3");
    ytdl(url, { filter: "audioonly" }).pipe(res);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Streaming failed" });
  }
};

exports.downloadYTMusic = async (req, res) => {
  const videoId = req.params.videoId;
  try {
    const url = `https://www.youtube.com/watch?v=${videoId}`;
    res.setHeader("Content-Disposition", `attachment; filename="music.mp3"`);
    res.setHeader("Content-Type", "audio/mpeg");
    ytdl(url, { filter: "audioonly" }).pipe(res);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Download failed" });
  }
};
