  const express = require("express");
  const auth = require("../middleware/auth");
  const fs = require("fs");
  const path = require("path");
  const multer = require("multer");
  const db = require("../config/database"); // mysql2 connection

  const router = express.Router();

  // configure multer to save files in /assets folder
  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, "assets/"); // save in /assets
    },
    filename: (req, file, cb) => {
      cb(null, Date.now() + "-" + file.originalname); // unique filename
    }
  });

  const upload = multer({ storage });

  const mapUser = (row) => ({
    _id: row.user_id,
    name: row.user_name,
    email: row.user_email,
    profilePicture: row.user_profile_picture,
    bio: row.user_bio || "Hey! I am using whatsapp",
    status: row.user_status || "offline",
    lastSeen: row.user_last_seen
  });


  // Get all users (excluding current user)
  router.get("/", auth, async (req, res) => {
    try {
  const [rows] = await db.promise().query(`
    SELECT DISTINCT u.*
    FROM user u
    LEFT JOIN chat_members cm ON u.user_id = cm.cm_user_id
    LEFT JOIN chat_members cm2 ON cm.cm_chat_id = cm2.cm_chat_id AND cm2.cm_user_id = ?
    WHERE cm2.cm_user_id IS NULL
      AND u.user_id != ?
    LIMIT 5
  `, [req.user.userId, req.user.userId]);


      res.json(rows.map(mapUser));
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Server error", error: error.message });
    }
  });

  // Search users
  router.get("/search", auth, async (req, res) => {
    try {
      const { query } = req.query;

      if (!query) {
        return res.status(400).json({ message: "Search query is required" });
      }

      const [rows] = await db
        .promise()
        .query(
          `SELECT * FROM user 
          WHERE user_id != ? AND (user_name LIKE ? OR user_email LIKE ?) 
          LIMIT 5`,
          [req.user.userId, `%${query}%`, `%${query}%`]
        );

      res.json(rows.map(mapUser));
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Server error", error: error.message });
    }
  });

  // Get user by ID
  router.get("/:userId", auth, async (req, res) => {
    try {
      const [rows] = await db.promise().query("SELECT * FROM user WHERE user_id = ?", [req.params.userId]);

      if (rows.length === 0) {
        return res.status(404).json({ message: "User not found" });
      }

      res.json(mapUser(rows[0]));
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Server error", error: error.message });
    }
  });






  // Update user profile
  router.put("/profile",upload.single("profilePicture"),auth,async (req, res) => {
      try {
        const { name, bio } = req.body;

        let profilePicturePath = null;
        if (req.file) {
          profilePicturePath = `assets/${req.file.filename}`;

          const [old] = await db.promise().query("SELECT user_profile_picture FROM user WHERE user_id = ?", [req.user.userId]);

          if (old.length > 0 && old[0].user_profile_picture && fs.existsSync(path.join(__dirname, "..", old[0].user_profile_picture))) {
            fs.unlinkSync(path.join(__dirname, "..", old[0].user_profile_picture));
          }
        }

await db.promise().query(
  `UPDATE user 
   SET user_name = ?, user_bio = ?, user_profile_picture = ? 
   WHERE user_id = ?`,
  [name, bio, profilePicturePath, req.user.userId]
);


        const [updated] = await db.promise().query("SELECT * FROM user WHERE user_id = ?", [req.user.userId]);

        res.json(mapUser(updated[0]));
      } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error", error: error.message });
      }
    }
  );

  // Update user status
  router.put("/status", auth, async (req, res) => {
    try {
      const { status } = req.body;

      if (!["online", "offline"].includes(status.toLowerCase())) {
        return res.status(400).json({ message: "Invalid status" });
      }

      await db
        .promise()
        .query(
          `UPDATE user 
          SET user_status = ?, 
              user_last_seen = CASE WHEN ? = 'offline' THEN CURRENT_TIMESTAMP ELSE user_last_seen END 
          WHERE user_id = ?`,
          [status, status, req.user.userId]
        );

      const [rows] = await db
        .promise()
        .query("SELECT * FROM user WHERE user_id = ?", [req.user.userId]);

      res.json(mapUser(rows[0]));
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Server error", error: error.message });
    }
  });

  module.exports = router;
