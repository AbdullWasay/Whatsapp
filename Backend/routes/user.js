const express = require('express');
const User = require('../models/User');
const auth = require('../middleware/auth');
const fs = require("fs");
const path = require("path");
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




// Get all users (excluding current user)
router.get('/', auth, async (req, res) => {
  try {
    const users = await User.find({
      _id: { $ne: req.user._id }
    }).select('name email profilePicture bio status lastSeen').limit(50);

    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Search users to start chat
router.get('/search', auth, async (req, res) => {
  try {
    const { query } = req.query;
    
    if (!query) {
      return res.status(400).json({ message: 'Search query is required' });
    }

    const users = await User.find({
      $and: [
        { _id: { $ne: req.user._id } },
        {
          $or: [
            { name: { $regex: query, $options: 'i' } },//ignores case
            { email: { $regex: query, $options: 'i' } }
          ]
        }
      ]
    }).select('name email profilePicture bio status lastSeen').limit(20);

    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});


// Get user by ID
router.get('/:userId', auth, async (req, res) => {
  try {
    const user = await User.findById(req.params.userId)
      .select('name email profilePicture bio status lastSeen');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update user profile
router.put('/profile', upload.single('profilePicture'), auth, async (req, res) => {
  try {
    const { name, bio } = req.body;

    const updateData = {};
    if (name) updateData.name = name;
    if (bio) updateData.bio = bio;

    if (req.file) {
      const profilePicturePath = `assets/${req.file.filename}`;

      const user = await User.findById(req.user._id);
      if (user.profilePicture && fs.existsSync(path.join(__dirname, "..", user.profilePicture))) {
        fs.unlinkSync(path.join(__dirname, "..", user.profilePicture));
      }

      updateData.profilePicture = profilePicturePath;
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      updateData,
      { new: true, runValidators: true }
    ).select('name bio profilePicture email');

    res.json(updatedUser);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update user status
router.put('/status', auth, async (req, res) => {
  try {
    const { status } = req.body;

    if (!['online', 'offline'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { 
        status,
        lastSeen: status === 'offline' ? new Date() : req.user.lastSeen
      },
      { new: true }
    ).select('-password');

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
