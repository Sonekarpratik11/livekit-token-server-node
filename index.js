import express from "express";
import cors from "cors";
import { AccessToken } from "livekit-server-sdk";

const app = express();
// CORS setup for wide access (use specific origins in production)
app.use(cors()); 
app.use(express.json());

// Load keys from environment variables (set on Render) or use placeholders
const LIVEKIT_API_KEY = process.env.secret1102 || "YOUR_LIVEKIT_API_KEY_HERE";
const LIVEKIT_API_SECRET = process.env.secret_1102 || "YOUR_LIVEKIT_API_SECRET_HERE";

// LiveKit Server URL (Render instance)
const LIVEKIT_URL = "wss://livekit-ejvx.onrender.com";

// Health Check Route (To confirm server is alive)
app.get("/", (req, res) => {
  res.send("<h1>LiveKit Token Server is ALIVE!</h1><p>Use POST /getToken to generate tokens.</p>");
});

// Main Token Generation Endpoint
app.post("/getToken", (req, res) => {
  // Get required data from the request body
  const { roomName, userName, role } = req.body;

  if (!roomName || !userName || !role) {
    return res.status(400).json({ error: "roomName, userName, role required in JSON body" });
  }
  
  // Use the keys loaded from Render Environment Variables
  const at = new AccessToken(LIVEKIT_API_KEY, LIVEKIT_API_SECRET, {
    identity: userName,
  });

  // Grant permissions based on role
  at.addGrant({
    roomJoin: true,
    room: roomName,
    // Streamer/Publisher/Participant can publish
    canPublish: role === "publisher" || role === "participant",
    canPublishData: true,
    // Viewer/Subscriber/Participant can subscribe
    canSubscribe: role === "subscriber" || role === "participant" || role === "viewer",
  });

  const token = at.toJwt();

  // Send the token and the LiveKit URL back to the Flutter client
  res.json({
    token: token,
    url: "https://livekit-ejvx.onrender.com",
  });
});

// Render provides the PORT environment variable, but for safety, we listen on 3000
// Render automatically handles the port binding.
const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`🔥 Server running on port ${port}`));