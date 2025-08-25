const express = require('express');
const auth = require('../middleware/auth');
const db = require('../config/database');
const { io } = require('../server'); 

const router = express.Router();

const mapUser = (userRow) => ({
  _id: userRow.user_id,
  name: userRow.user_name,
  email: userRow.user_email,
  profilePicture: userRow.user_profile_picture,
  bio: userRow.user_bio || "Hey! I am using whatsapp",
  status: userRow.user_status || "Offline",
  lastSeen: userRow.user_last_seen
});

const mapChat = (chatRow, members = [], lastMessage = null) => ({
  _id: chatRow.chat_id,
  isGroup: chatRow.chat_isgroup,
  groupName: chatRow.chat_group_name,
  members: members,
  lastMessage: lastMessage ? { messageId: lastMessage } : null,
  updatedAt: chatRow.chat_updated_at
});

const mapMessage = (messageRow, sender = null) => ({
  _id: messageRow.message_id,
  senderId: messageRow.message_sender_id ,
  content: messageRow.message_content,
  chatId: messageRow.message_chat_id,
  createdAt: messageRow.message_created_at,
  status: messageRow.message_status
});

//Get Apis

//Get all chats of user
router.get('/', auth, async (req, res) => {
  try {
    // Get all chats where user is a member
    const [chatRows] = await db.promise().query(`
     SELECT c.*, m.message_content, m.message_created_at, m.message_sender_id,m.message_status
FROM chat c
INNER JOIN chat_members cm ON c.chat_id = cm.cm_chat_id
LEFT JOIN message m ON c.chat_last_message_id = m.message_id
WHERE cm.cm_user_id = ?
  AND EXISTS (
    SELECT 1 FROM message msg WHERE msg.message_chat_id = c.chat_id
  )
ORDER BY c.chat_updated_at DESC;

    `, [req.user.userId]);

    const chats = [];

    for (const chatRow of chatRows) {
      // Get all members for this chat
      const [memberRows] = await db.promise().query(`
        SELECT u.*
        FROM user u
        INNER JOIN chat_members cm ON u.user_id = cm.cm_user_id
        WHERE cm.cm_chat_id = ?
      `, [chatRow.chat_id]);

      const members = memberRows.map(mapUser);

      // Get last message if exists
      let lastMessage = null;
      if (chatRow.chat_last_message_id) {
        lastMessage = mapMessage({
          message_id: chatRow.chat_last_message_id,
          message_content: chatRow.message_content,
          message_created_at: chatRow.message_created_at,
          message_sender_id: chatRow.message_sender_id,
          message_status:chatRow.message_status
        });
      }

      chats.push(mapChat(chatRow, members, lastMessage));
    }

    res.json(chats);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

//Post Apis
// Create a new chat (private or group)
router.post('/', auth, async (req, res) => {
  try {
    const { members, isGroup, groupName } = req.body;

    const allMembers = [...new Set([req.user.userId.toString(), ...members])];

    // For private chats, check if chat already exists
    if (!isGroup && allMembers.length === 2) {
      const [existingChat] = await db.promise().query(`
        SELECT c.*, COUNT(cm.cm_user_id) as member_count
        FROM chat c
        INNER JOIN chat_members cm ON c.chat_id = cm.cm_chat_id
        WHERE c.chat_isgroup = FALSE
        AND cm.cm_user_id IN (?, ?)
        GROUP BY c.chat_id
        HAVING member_count = 2
      `, allMembers);

      if (existingChat.length > 0) {
        // Get members for existing chat
        const [memberRows] = await db.promise().query(`
          SELECT u.*
          FROM user u
          INNER JOIN chat_members cm ON u.user_id = cm.cm_user_id
          WHERE cm.cm_chat_id = ?
        `, [existingChat[0].chat_id]);

        const members = memberRows.map(mapUser);
        return res.json(mapChat(existingChat[0], members));
        
      }
    }

    // Create new chat
    const [chatResult] = await db.promise().query(`
      INSERT INTO chat (chat_isgroup, chat_group_name, chat_updated_at)
      VALUES (?, ?, CURRENT_TIMESTAMP)
    `, [isGroup || false, isGroup ? groupName : null]);

    const chatId = chatResult.insertId;

    // Add members to chat_members table
    const memberValues = allMembers.map(memberId => [memberId, chatId]);
    await db.promise().query(`
      INSERT INTO chat_members (cm_user_id, cm_chat_id) VALUES ?
    `, [memberValues]);

    // Get the created chat with members
    const [chatRows] = await db.promise().query(`
      SELECT * FROM chat WHERE chat_id = ?
    `, [chatId]);

    const [memberRows] = await db.promise().query(`
      SELECT u.*
      FROM user u
      INNER JOIN chat_members cm ON u.user_id = cm.cm_user_id
      WHERE cm.cm_chat_id = ?
    `, [chatId]);

    const chatMembers = memberRows.map(mapUser);
    const newChat = mapChat(chatRows[0], chatMembers);

    res.status(201).json(newChat);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;