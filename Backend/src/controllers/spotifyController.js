const axios = require("axios");

// Function to obtain an access token using the Client Credentials flow
const getSpotifyAccessToken = async () => {
  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error("Spotify credentials are not configured.");
  }

  // Spotify requires the clientId and clientSecret to be encoded in base64
  const authString = Buffer.from(`${clientId}:${clientSecret}`).toString(
    "base64"
  );

  const response = await axios.post(
    "https://accounts.spotify.com/api/token",
    "grant_type=client_credentials",
    {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${authString}`,
      },
    }
  );

  return response.data.access_token;
};

// Controller function to search for tracks on Spotify
exports.searchTracks = async (req, res) => {
  try {
    const query = req.query.q;
    if (!query) {
      return res
        .status(400)
        .json({ error: "Search query parameter 'q' is required." });
    }

    // Get the access token from Spotify
    const token = await getSpotifyAccessToken();

    // Construct the Spotify Search API URL
    const apiUrl = `https://api.spotify.com/v1/search?query=${encodeURIComponent(
      query
    )}&type=track&limit=10`;

    const response = await axios.get(apiUrl, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    // Return the search results to the client
    res.json(response.data);
  } catch (error) {
    console.error(
      "Error searching Spotify tracks:",
      error.response ? error.response.data : error.message
    );
    res
      .status(500)
      .json({ error: "Server error while searching Spotify tracks." });
  }
};
