// const express = require('express');
// const jwt = require('jsonwebtoken');
// const User = require('../models/User');
// const router = express.Router();

// // Signup Endpoint
// router.post('/signup', async (req, res) => {
//   try {
//     const { email, password } = req.body;
//     if (!email || !password) {
//       return res.status(400).json({ message: 'Email and password are required' });
//     }
//     const existingUser = await User.findOne({ email });
//     if (existingUser) {
//       return res.status(400).json({ message: 'User already exists' });
//     }
//     const user = new User({ email, password });
//     await user.save();
//     const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
//     res.status(201).json({ token, user: { email: user.email, name: user.name } });
//   } catch (error) {
//     res.status(500).json({ message: 'Server error', error: error.message });
//   }
// });

// // Login Endpoint
// router.post('/login', async (req, res) => {
//   try {
//     const { email, password } = req.body;
//     const user = await User.findOne({ email });
//     if (!user || !(await user.comparePassword(password))) {
//       return res.status(401).json({ message: 'Invalid credentials' });
//     }
//     const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
//     res.status(200).json({ token, user: { email: user.email, name: user.name } });
//   } catch (error) {
//     res.status(500).json({ message: 'Server error', error: error.message });
//   }
// });

// // User Endpoint (Protected)
// router.get('/user', async (req, res) => {
//   try {
//     const token = req.headers.authorization?.split(' ')[1];
//     if (!token) return res.status(401).json({ message: 'No token provided' });
//     const decoded = jwt.verify(token, process.env.JWT_SECRET);
//     const user = await User.findById(decoded.userId).select('-password');
//     if (!user) return res.status(404).json({ message: 'User not found' });
//     res.status(200).json({ user });
//   } catch (error) {
//     res.status(401).json({ message: 'Invalid token', error: error.message });
//   }
// });


// module.exports = router;

const express = require("express");
const cors = require("cors");
const { OAuth2Client } = require("google-auth-library");
const jwt = require("jsonwebtoken");
require("dotenv").config(); // Load environment variables

const app = express();
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID); // Google Client for token verification

// Middleware
app.use(cors({ origin: "http://localhost:3000" })); // Allow requests from React app
app.use(express.json()); // Parse JSON bodies

// Simulated database (replace with real database, e.g., MongoDB)
const users = [
  // Example user for email/password login
  { email: "test@example.com", password: "password123", name: "Test User" },
];

// Email/Password Login Endpoint
app.post("/api/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    // Find user in "database"
    const user = users.find((u) => u.email === email && u.password === password);
    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // Generate JWT
    const token = jwt.sign({ email: user.email }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });

    // Return user data and token
    res.status(200).json({
      user: { email: user.email, name: user.name },
      token,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

// Google OAuth Endpoint
app.post("/api/google-auth", async (req, res) => {
  const { credential } = req.body; // Google ID token from frontend

  try {
    // Verify Google ID token
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload(); // Get user info
    const { email, name, sub: googleId } = payload;

    // Simulate database logic: find or create user
    let user = users.find((u) => u.email === email);
    if (!user) {
      user = { email, name, googleId, authSource: "google" };
      users.push(user); // Add to "database" (replace with real DB save)
    }

    // Generate JWT
    const token = jwt.sign({ email: user.email }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });

    // Return user data and token
    res.status(200).json({
      user: { email: user.email, name: user.name },
      token,
    });
  } catch (error) {
    console.error("Google auth error:", error);
    res.status(400).json({ error: "Google login failed" });
  }
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
