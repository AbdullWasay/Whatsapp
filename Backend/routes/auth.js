const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const auth = require('../middleware/auth');
const multer= require('multer');
const router = express.Router();



// configure multer to save files in /assets folder
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "assets/"); // save in /assets
  },
  filename: (req, file, cb) => {
    // unique filename: timestamp-originalname
    cb(null, Date.now() + "-" + file.originalname);
  }
});

const upload=multer({storage});


// Generate JWT Token Function
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

router.get('/me', auth, async (req, res) => {
  try {
    res.json({
      user: {
        id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        profilePicture: req.user.profilePicture,
        bio: req.user.bio,
        status: req.user.status,
        lastSeen: req.user.lastSeen
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.post("/register", upload.single("profilePicture"), async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    let profilePicturePath = "";
    if (req.file) {
      profilePicturePath = `assets/${req.file.filename}`;
    }

    // Create new user
    const user = new User({
      name,
      email,
      password,
      profilePicture: profilePicturePath
    });
    await user.save();

    // Generate token
    const token = generateToken(user._id);

    res.status(201).json({
      message: "User created successfully",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        profilePicture: user.profilePicture,
        bio: user.bio,
        status: user.status
      }
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ 
        success: false,
        message: 'Invalid credentials' 
      });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Update user status to Online
    user.status = 'Online';
    user.lastSeen = new Date();
    await user.save();

    // Generate token
    const token = generateToken(user._id);

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        profilePicture: user.profilePicture,
        bio: user.bio,
        status: user.status
      }
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Server error', 
      error: error.message 
    });
  }
});


// Logout
router.post('/logout', auth, async (req, res) => {
  try {
    // Update user status to Offline
    req.user.status = 'Offline';
    req.user.lastSeen = new Date();
    await req.user.save();

    res.json({ message: 'Logout successful' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
