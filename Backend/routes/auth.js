const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const multer = require('multer');
const db = require("../config/database");
const auth = require('../middleware/auth');

const router = express.Router();

// Multer configuration for profile picture uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "assets/");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  }
});

const upload = multer({ storage });

// JWT token generator
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

const mapUser = (userRow) => ({
  id: userRow.user_id,
  name: userRow.user_name,
  email: userRow.user_email,
  profilePicture: userRow.user_profile_picture,
  bio: userRow.user_bio || "Hey! I am using whatsapp",
  status: userRow.user_status || "Offline",
  lastSeen: userRow.user_last_seen
});


// Get current logged-in user
router.get('/me', auth, async (req, res) => {
  try {
    const [results] = await db.promise().query(
      "SELECT * FROM user WHERE user_id = ?",
      [req.user.userId]
    );

    if (results.length === 0) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    res.json({ user: mapUser(results[0]) });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
});

// Register new user
router.post("/register", upload.single("profilePicture"), async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Check if user already exists
    const [existingUser] = await db.promise().query(
      "SELECT * FROM user WHERE user_email = ?",
      [email]
    );

    if (existingUser.length > 0) {
      return res.status(400).json({ success: false, message: "User already exists" });
    }

    // Handle profile picture
    let profilePicturePath = "";
    if (req.file) {
      profilePicturePath = `assets/${req.file.filename}`;
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert new user
    const [result] = await db.promise().query(
      `INSERT INTO user (user_name, user_email, user_password, user_profile_picture) 
       VALUES (?, ?, ?, ?)`,
      [name, email, hashedPassword, profilePicturePath]
    );

    const userId = result.insertId;
    const token = generateToken(userId);

    res.status(201).json({
      success: true,
      message: "User created successfully",
      token,
      user: {
        id: userId,
        name,
        email,
        profilePicture: profilePicturePath,
        bio: "Hey! I am using whatsapp",
        status: "Offline"
      }
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const [existingUser] = await db.promise().query(
      "SELECT * FROM user WHERE user_email = ?",
      [email]
    );

    if (existingUser.length === 0) {
      return res.status(400).json({ success: false, message: "User does not exist" });
    }

    const user = existingUser[0];

    const isMatch = await bcrypt.compare(password, user.user_password);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: "Invalid credentials" });
    }

    const userId = user.user_id;
    const token = generateToken(userId);

    // Update user status to Online
    await db.promise().query(
      "UPDATE user SET user_status = ?, user_last_seen = ? WHERE user_id = ?",
      ['Online', new Date(), userId]
    );

    res.json({
      success: true,
      message: "Login successful",
      token,
      user: mapUser({ ...user, user_status: 'Online', user_last_seen: new Date() })
    });

  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// Logout
router.post('/logout', auth, async (req, res) => {
  try {
    const userId = req.user.userId;

    const [existingUser] = await db.promise().query(
      "SELECT * FROM user WHERE user_id = ?",
      [userId]
    );

    if (existingUser.length === 0) {
      return res.status(400).json({ success: false, message: "User does not exist" });
    }

    // Update user status to Offline
    await db.promise().query(
      "UPDATE user SET user_status = ?, user_last_seen = ? WHERE user_id = ?",
      ['Offline', new Date(), userId]
    );

    res.json({ success: true, message: 'Logout successful' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

module.exports = router;
