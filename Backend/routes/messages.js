const express = require('express');
const auth = require('../middleware/auth');
const db = require('../config/database');
const router = express.Router();



const mapMessage = (messageRow, sender = null) => ({
  _id: messageRow.message_id,
  senderId: sender || { _id: messageRow.message_sender_id, name: messageRow.sender_name },
  content: messageRow.message_content,
  chatId: messageRow.message_chat_id,
  createdAt: messageRow.message_created_at,
  status: messageRow.message_status, 
  messageType: 'text', 
  fileUrl: '' 
});

// Get messages for a chat
router.get('/:chatId', auth, async (req, res) => {
  try {
    const { chatId } = req.params;
    const { page = 1, limit = 50 } = req.query;

    // check membership
    const [memberCheck] = await db.promise().query(`
      SELECT 1 FROM chat_members
      WHERE cm_chat_id = ? AND cm_user_id = ?
    `, [chatId, req.user.userId]);

    if (memberCheck.length === 0) {
      return res.status(404).json({ message: 'Chat not found' });
    }

    // mark all messages not sent by me as read
    await db.promise().query(`
      UPDATE message
      SET message_status = 'read'
      WHERE message_chat_id = ?
        AND message_sender_id != ?
        AND message_status != 'read'
    `, [chatId, req.user.userId]);

    // now fetch messages
    const [messageRows] = await db.promise().query(`
      SELECT m.*, u.user_name as sender_name
      FROM message m
      LEFT JOIN user u ON m.message_sender_id = u.user_id
      WHERE m.message_chat_id = ?
      ORDER BY m.message_created_at DESC
      LIMIT ? OFFSET ?
    `, [chatId, parseInt(limit), (parseInt(page) - 1) * parseInt(limit)]);

    const messages = messageRows.map(row => mapMessage(row)).reverse();
    res.json(messages);

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
