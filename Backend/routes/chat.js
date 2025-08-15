const express=require('express')
const auth=require('../middleware/auth')
const Chat=require('../models/Chat')
const router=express.Router();

//Get Apis

//Get all chats of user
router.get('/',auth,async(req,res)=>{
    try{
        const chats = await Chat.find({
            members:req.user._id
        })
        .populate('members', 'name email bio status lastSeen')
        .populate('lastMessage.messageId')
        .sort({updatedAt:-1});
        res.json(chats)
    }
    catch(error)
    {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Get chat by ID
router.get('/:chatId', auth, async (req, res) => {
  try {
    const chat = await Chat.findOne({
      _id: req.params.chatId,
      members: req.user._id
    }).populate('members', 'name email bio status lastSeen');

    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }

    res.json(chat);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});


//Post Apis
// Create a new chat (private or group)
router.post('/', auth, async (req, res) => {
  try {
    const { members, isGroup, groupName } = req.body;

    // Add current user to members if not already included
    const allMembers = [...new Set([req.user._id.toString(), ...members])];

    // For private chats, check if chat already exists
    if (!isGroup && allMembers.length === 2) {
      const existingChat = await Chat.findOne({
        isGroup: false,
        members: { $all: allMembers, $size: 2 }
      }).populate('members', 'name email bio status lastSeen');

      if (existingChat) {
        return res.json(existingChat);
      }
    }

    const chatData = {
      members: allMembers,
      isGroup,
      ...(isGroup && {
        groupName,
      })
    };

    const chat = new Chat(chatData);
    await chat.save();

    const populatedChat = await Chat.findById(chat._id)
      .populate('members', 'name email bio status lastSeen');

    res.status(201).json(populatedChat);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});



module.exports = router;