const favoriteSongSchema = new mongoose.Schema({
  userId: String,
  song: {
    title: String,
    artist: String,
    videoId: String,
    thumbnail: String,
  },
  addedAt: { type: Date, default: Date.now },
});
const Favorite = mongoose.model("Favorite", favoriteSongSchema);
