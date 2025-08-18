const express = require('express');
const Message = require('../models/Message');
const Chat = require('../models/Chat');
const auth = require('../middleware/auth');

const router = express.Router();

// Get messages for a chat
router.get('/:chatId', auth, async (req, res) => {
  try {
    const { chatId } = req.params;
    const { page = 1, limit = 50 } = req.query;

    const chat = await Chat.findOne({
      _id: chatId,
      members: req.user._id
    });

    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }

    const messages = await Message.find({ chatId })
      .populate('senderId', 'name')
      .populate('systemMessageData.addedBy', 'name')
      .populate('systemMessageData.addedMembers', 'name')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    res.json(messages.reverse());
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Send a message
router.post('/', auth, async (req, res) => {
  try {
    const { content, chatId, messageType = 'text', fileUrl = '' } = req.body;

    const chat = await Chat.findOne({
      _id: chatId,
      members: req.user._id
    });

    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }

    const message = new Message({
      senderId: req.user._id,
      content,
      chatId,
      messageType,
      fileUrl
    });

    await message.save();

    // Update chat's last message
    chat.lastMessage = { messageId: message._id };
    chat.updatedAt = new Date();
    await chat.save();

    const populatedMessage = await Message.findById(message._id)
      .populate('senderId', 'name')
      .populate('systemMessageData.addedBy', 'name')
      .populate('systemMessageData.addedMembers', 'name');

    res.status(201).json(populatedMessage);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});


module.exports = router;
