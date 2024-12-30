import express from "express";
import { json } from "body-parser";
import { config } from "dotenv";
import cors from "cors";

// Load environment variables from .env file
config();

const app = express();
const PORT = process.env.PORT || 3005;

// Store the last received location
let currentLocation = {
  latitude: null,
  longitude: null,
  accuracy: null
};

// CORS with Preflight
app.use(cors({
  origin: 'https://camion.navidadloprado.cl',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.options('*', cors()); // Handle OPTIONS requests

// Explicitly set headers for all responses
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', 'https://camion.navidadloprado.cl');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  next();
});

app.use(json());

// Login endpoint
app.post("/api/login", (req, res) => {
  const { password } = req.body;

  // Log the received data
  console.log("Received login data:", { password });

  if (!password) {
    return res.status(400).json({ error: "Password is required" });
  }

  // Check the password against the one in the .env file
  if (password !== process.env.NEXT_PUBLIC_PASSWORD) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  res.status(200).json({ message: "Login successful" });
});

// Location endpoint (updated to remove token logic)
app.post("/api/location", (req, res) => {
  const { latitude, longitude, accuracy } = req.body;

  // Log the received data
  console.log("Received location data:", { latitude, longitude, accuracy });

  if (!latitude || !longitude) {
    return res.status(400).json({ error: "Latitude and longitude are required" });
  }

  // Update the current location
  currentLocation = {
    latitude,
    longitude,
    accuracy
  };

  console.log(`Updated location: ${latitude}, ${longitude}`);
  res.status(200).json({ message: "Location saved successfully" });
});

// GET /api/location endpoint to fetch the latest location data
app.get("/api/location", (req, res) => {
  if (currentLocation.latitude === null || currentLocation.longitude === null) {
    return res.status(404).json({ error: "No location data available" });
  }

  res.json(currentLocation);
});

// Pascuero endpoint
app.get('/pascuero', (req, res) => {
  res.json({ message: "Pascuero endpoint is working" });
});

// Error handling middleware
// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: "Internal server error" });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});