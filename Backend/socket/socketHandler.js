const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Message = require('../models/Message');
const Chat = require('../models/Chat');

const connectedUsers = new Map(); // user id+socketId

const socketAuth = async (socket, next) => {
  try {
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error('Authentication error'));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user) {
      return next(new Error('Authentication error'));
    }

    socket.userId = user._id.toString();
    socket.user = user;
    next();
  } catch (error) {
    next(new Error('Authentication error'));
  }
};

const handleConnection = (io) => {
  io.use(socketAuth);

  io.on('connection', async (socket) => {
    console.log(`User ${socket.user.name} connected`);
    
    // Store user connection
    connectedUsers.set(socket.userId, socket.id);
    
    // Update user status to online
    await User.findByIdAndUpdate(socket.userId, { 
      status: 'online',
      lastSeen: new Date()
    });

    // Join user to their chat rooms
    const userChats = await Chat.find({ members: socket.userId });
    userChats.forEach(chat => {
      socket.join(chat._id.toString());
    });

    // Notify other users that this user is online
    socket.broadcast.emit('userStatusUpdate', {
      userId: socket.userId,
      status: 'online'
    });

    // Handle joining a chat room
    socket.on('joinChat', (chatId) => {
      socket.join(chatId);
      console.log(`User ${socket.user.name} joined chat ${chatId}`);
    });

    // Handle leaving a chat room
    socket.on('leaveChat', (chatId) => {
      socket.leave(chatId);
      console.log(`User ${socket.user.name} left chat ${chatId}`);
    });

    // Handle sending a message
    socket.on('sendMessage', async (data) => {
      try {
        const { content, chatId, messageType = 'text', fileUrl = '' } = data;

        // Verify user is member of the chat
        const chat = await Chat.findOne({
          _id: chatId,
          members: socket.userId
        });

        // Create message
        const message = new Message({
          senderId: socket.userId,
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

        // Populate message with sender info
        const populatedMessage = await Message.findById(message._id)
          .populate('senderId', 'name ');

        // Emit to all users in the chat
        io.to(chatId).emit('newMessage', populatedMessage);


        console.log(`Message sent to chat ${chatId} by ${socket.user.name}`);
      } catch (error) {
        socket.emit('error', { message: 'Failed to send message' });
        console.error('Send message error:', error);
      }
    });


    // Handle disconnect
    socket.on('disconnect', async () => {
      console.log(`User ${socket.user.name} disconnected`);
      
      // Remove from connected users
      connectedUsers.delete(socket.userId);
      
      // Update user status to offline
      await User.findByIdAndUpdate(socket.userId, { 
        status: 'offline',
        lastSeen: new Date()
      });

      // Notify other users that this user is offline
      socket.broadcast.emit('userStatusUpdate', {
        userId: socket.userId,
        status: 'offline',
        lastSeen: new Date()
      });
    });
  });
};

module.exports = { handleConnection, connectedUsers };
