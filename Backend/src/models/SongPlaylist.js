const songPlaylistSchema = new mongoose.Schema({
  userId: String,
  name: String,
  songs: [
    {
      title: String,
      artist: String,
      videoId: String,
      thumbnail: String,
    },
  ],
  isPublic: { type: Boolean, default: false },
  shareId: { type: String, unique: true, default: uuidv4 },
  createdAt: { type: Date, default: Date.now },
});
const Playlist = mongoose.model("Playlist", songPlaylistSchema);
