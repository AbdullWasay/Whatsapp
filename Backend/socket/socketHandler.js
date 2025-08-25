const jwt = require('jsonwebtoken');
const db = require('../config/database');
const connectedUsers = new Map(); 

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


const mapUser = (userRow) => ({
  _id: userRow.user_id,
  name: userRow.user_name,
  email: userRow.user_email,
  profilePicture: userRow.user_profile_picture,
  bio: userRow.user_bio || "Hey! I am using whatsapp",
  status: userRow.user_status || "Offline",
  lastSeen: userRow.user_last_seen
});
  
const socketAuth = async (socket, next) => {
  try {
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error('Authentication error'));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const [userRows] = await db.promise().query(
      'SELECT * FROM user WHERE user_id = ?',
      [decoded.userId]
    );
    if (userRows.length === 0) {
      return next(new Error('Authentication error'));
    }

    const user = mapUser(userRows[0]);




    socket.userId = user._id.toString();
    socket.user = user;
    next();
  } catch (error) {
    next(new Error('Authentication error'));
  }
};

const handleConnection = (io) => {
  io.use(socketAuth);

// Handle new connections
  io.on('connection', async (socket) => {
    console.log(`User ${socket.user.name} connected`);
    // Store user connection
    connectedUsers.set(socket.userId, socket.id);
    
    // Update user status to online
    await db.promise().query(
      'UPDATE user SET user_status = ?, user_last_seen = CURRENT_TIMESTAMP WHERE user_id = ?',
      ['online', socket.userId]
    );
    
    const [userChats] = await db.promise().query(`
      SELECT c.chat_id
      FROM chat c
      INNER JOIN chat_members cm ON c.chat_id = cm.cm_chat_id
      WHERE cm.cm_user_id = ?
    `, [socket.userId]);
    userChats.forEach(chat => {
      socket.join(chat.chat_id.toString());
    });



    userChats.forEach(chat => {
  io.to(chat.chat_id.toString()).emit('userStatusUpdate', {
    userId: socket.userId,
    name: socket.user.name,
    status: 'online',
    lastSeen: new Date() 
  });
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

// Notify others when chat created
    socket.on("chat-created", ({ chat, members }) => {
  members.forEach(memberId => {
    if (memberId !== socket.userId) { 
      const memberSocketId = connectedUsers.get(memberId.toString());
      if (memberSocketId) {
        io.to(memberSocketId).emit("chat-created", chat);
      }
    }
  });
});







// Handle sending a message
    socket.on('sendMessage', async (data) => {
      try {
        const { content, chatId, messageType = 'text', fileUrl = '' } = data;

        // Verify user is member of the chat
        const [memberCheck] = await db.promise().query(`
          SELECT 1 FROM chat_members
          WHERE cm_chat_id = ? AND cm_user_id = ?
        `, [chatId, socket.userId]);
        if (memberCheck.length === 0) {
          socket.emit('error', { message: 'You are not a member of this chat' });
          return;
        }

        const [messageResult] = await db.promise().query(`
          INSERT INTO message (message_sender_id, message_content, message_chat_id, message_created_at, message_status)
          VALUES (?, ?, ?, CURRENT_TIMESTAMP, 'delivered')
        `, [socket.userId, content, chatId]);
        const messageId = messageResult.insertId;


//update chat's last message        
        await db.promise().query(`
          UPDATE chat
          SET chat_last_message_id = ?, chat_updated_at = CURRENT_TIMESTAMP 
          WHERE chat_id = ?
        `, [messageId, chatId]);

        //popiate meassage with sender info
        const [messageRows] = await db.promise().query(`
          SELECT m.*, u.user_name as sender_name
          FROM message m
          LEFT JOIN user u ON m.message_sender_id = u.user_id
          WHERE m.message_id = ?
        `, [messageId]);

        const populatedMessage = mapMessage(messageRows[0]);

        
   


        // Emit to all users in the chat
        io.to(chatId).emit('newMessage', populatedMessage);


        console.log(`Message sent to chat ${chatId} by ${socket.user.name}`);
      } catch (error) {
        socket.emit('error', { message: 'Failed to send message' });
        console.error('Send message error:', error);
      }
    });





// Handle adding members to group
    socket.on('addGroupMembers', async (data) => {
      try {
        const { chatId, memberIds } = data;

        console.log('Socket: Adding members to group', { chatId, memberIds, userId: socket.userId });

        // Verify user is member of the group
        const [chatRows] = await db.promise().query(`
          SELECT c.*
          FROM chat c
          INNER JOIN chat_members cm ON c.chat_id = cm.cm_chat_id
          WHERE c.chat_id = ? AND c.chat_isgroup = TRUE AND cm.cm_user_id = ?
        `, [chatId, socket.userId]);

        if (chatRows.length === 0) {
          console.log('Socket: Group not found or user not a member');
          socket.emit('error', { message: 'Group not found or you are not a member' });
          return;
        }

        // Get existing members
        const [existingMembers] = await db.promise().query(`
          SELECT cm_user_id FROM chat_members WHERE cm_chat_id = ?
        `, [chatId]);

        const existingMemberIds = existingMembers.map(row => row.cm_user_id.toString());
        //console.log('Socket: Current chat members:', existingMemberIds);

        // Filter out members that are already in the group
        const newMemberIds = memberIds.filter(memberId =>
          !existingMemberIds.includes(memberId.toString())
        );

        console.log('Socket: New members to add:', newMemberIds);

        if (newMemberIds.length === 0) {
          console.log('Socket: All selected users are already members');
          socket.emit('error', { message: 'All selected users are already members of this group' });
          return;
        }

        // Add new members to the group
        const memberValues = newMemberIds.map(memberId => [memberId, chatId]);
        await db.promise().query(`
          INSERT INTO chat_members (cm_user_id, cm_chat_id) VALUES ?
        `, [memberValues]);

        // Update chat timestamp
        await db.promise().query(`
          UPDATE chat SET chat_updated_at = CURRENT_TIMESTAMP WHERE chat_id = ?
        `, [chatId]);

        // Add new members to the chat room
        newMemberIds.forEach(memberId => {
          const memberSocketId = connectedUsers.get(memberId);
          if (memberSocketId) {
            const memberSocket = io.sockets.sockets.get(memberSocketId);
            if (memberSocket) {
              memberSocket.join(chatId);
            }
          }
        });

        // Emit to all users in the chat (including new members)
        io.to(chatId).emit('groupMembersAdded', {
          chatId,
          addedMembers: newMemberIds,
          addedBy: socket.userId
        });

        console.log(`Members added to group ${chatId} by ${socket.user.name}`);
      } catch (error) {
        socket.emit('error', { message: 'Failed to add members' });
        console.error('Add members error:', error);
      }
    });



    //----------------------------Remove Member------------------------------

    //     // Handle adding members to group
    // socket.on('RemoveGroupMember', async (data) => {
    //   try {
    //     const { chatId, memberIds } = data;

    //     console.log('Socket: Removing member  group', { chatId, memberIds, userId: socket.userId });

    //     // Verify user is member of the group
    //     const chat = await Chat.findOne({
    //       _id: chatId,
    //       isGroup: true,
    //       members: socket.userId
    //     });

    //     if (!chat) {
    //       console.log('Socket: Group not found or user not a member');
    //       socket.emit('error', { message: 'Group not found or you are not a member' });
    //       return;
    //     }

    //     console.log('Socket: Current chat members:', chat.members.map(m => m.toString()));

    //     //filter and uptade members with all existing except the one that is being removed
    

    //     chat.members = chat.members.filter(id => id.toString() !== memberId);
    //     chat.updatedAt = new Date();
    //     await chat.save();

    //     // Remove member from the chat room
    

    //     const memberSocketId = connectedUsers.get(memberId);
    //         if (memberSocketId) {
    //           const memberSocket = io.sockets.sockets.get(memberSocketId);
    //           if (memberSocket) {
    //             memberSocket.leave(chatId);
    //           }
    //         }



    //     // Emit to all users in the chat (including new members)
    //     io.to(chatId).emit('groupMemberRemoved', {
    //       chatId,
    //       removedMember: memberIds,
    //       removedBy: socket.userId
    //     });

    //     console.log(`Memberremoved from group ${chatId} by ${socket.user.name}`);
    //   } catch (error) {
    //     socket.emit('error', { message: 'Failed to remove member' });
    //     console.error('remove member error:', error);
    //   }
    // });

 





        

  // Handle disconnect
socket.on('disconnect', async () => {
  console.log(`User ${socket.user.name} disconnected`);
  connectedUsers.delete(socket.userId);

  // update DB
  await db.promise().query(
    'UPDATE user SET user_status = ?, user_last_seen = CURRENT_TIMESTAMP WHERE user_id = ?',
    ['offline', socket.userId]
  );

  // notify all chat members
  userChats.forEach(chat => {
    io.to(chat.chat_id.toString()).emit('userStatusUpdate', {
      userId: socket.userId,
      name: socket.user.name,
      status: 'offline',
      lastSeen: new Date()
    });
  });
    
    });



    
  });
};

module.exports = { handleConnection, connectedUsers };
