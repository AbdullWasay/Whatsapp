import axios from 'axios';
import { useCallback, useEffect, useState } from 'react';

import { useAuth } from '../../Context/authContext';
import { useSocket } from '../../Context/socketContext';
import '../../css/Chat.css';
import GroupMemberSearch from '../User/groupMemberSearch';
import UserProfile from '../User/userProfile';
import UserSearch from '../User/userSearch';
import ChatHeader from './chatHeader';
import ChatList from './chatList';
import ChatWindow from './chatWindow';


const Chat = () => {
  const [chats, setChats] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [showUserSearch, setShowUserSearch] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showGroupMemberSearch, setShowGroupMemberSearch] = useState(false);
  const [loading, setLoading] = useState(true);
const token = localStorage.getItem('token'); 
  const { user, logout } = useAuth();
  const { socket } = useSocket();




  useEffect(() => {
    if (socket) {
  socket.on('newMessage', (message) => {
  if (selectedChat && message.chatId === selectedChat._id) {
    setMessages(prev => [...prev, message]);
  }

  // Update chat list
  setChats(prev => {
    const updated = prev.map(chat =>
      chat._id === message.chatId
        ? { ...chat, lastMessage: { messageId: message }, updatedAt: new Date() }
        : chat
    );

    // Move updated chat to top
    const movedChat = updated.find(c => c._id === message.chatId);
    const others = updated.filter(c => c._id !== message.chatId);
    return movedChat ? [movedChat, ...others] : updated;
  });
});


      socket.on("chat-created", newChat => {
      setChats(prev => {
        const exists = prev.some(chat => chat._id === newChat._id);
        if (exists) return prev;
        return [newChat, ...prev];
      });
    });
  

socket.on('userStatusUpdate', (data) => {
  setChats(prevChats => {
    return prevChats.map(chat => {
      const memberIndex = chat.members.findIndex(m => m.name === data.name);
      if (memberIndex === -1) return chat;
      // ^ user is not the member of the chat so dont update that!

      const updatedMembers = [...chat.members];
      updatedMembers[memberIndex] = {
        ...updatedMembers[memberIndex],
        status: data.status,
        lastSeen: data.lastSeen
      };

      return { ...chat, members: updatedMembers };
    });
  });
});



      socket.on('groupMembersAdded', (data) => {
        console.log('Frontend: Received groupMembersAdded event', data);

       
      });

      socket.on('error', (error) => {
        console.error('Socket error:', error);
        alert(error.message || 'An error occurred');
      });

      return () => {
        socket.off('newMessage');
        socket.off('groupMembersAdded');
        socket.off('error');
        socket.off("chat-created");
      };
    }
  }, [socket, selectedChat]);


const loadChats = useCallback(async () => {
  try {
    const response = await axios.get(process.env.REACT_APP_BACKEND_URL+'api/chat', {
      headers: { Authorization: `Bearer ${token}` }
    });
    setChats(response.data);
  } catch (error) {
    console.error('Error loading chats:', error);
  } finally {
    setLoading(false);
  }
}, [token]); // dependencies

useEffect(() => {
  loadChats();
}, [loadChats]);

  const loadMessages = async (chatId) => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_BACKEND_URL}api/messages/${chatId}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setMessages(response.data);
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const handleChatSelect = (chat) => {
    setSelectedChat(chat);
    loadMessages(chat._id);
    
    if (socket) {
      socket.emit('joinChat', chat._id);
    }
  };

  const handleSendMessage = (content) => {
    if (socket && selectedChat) {
      socket.emit('sendMessage', {
        content,
        chatId: selectedChat._id,
        messageType: 'text'
      });
    }
  };

 

  const handleCreateChat = async (userIds, isGroup = false, groupName = '', groupPicture = '') => {
    try {
      const chatData = {
        members: Array.isArray(userIds) ? userIds : [userIds],
        isGroup
      };

      if (isGroup) {
        chatData.groupName = groupName;
        if (groupPicture) {
          chatData.groupPicture = groupPicture;
        }
      }

      const response = await axios.post(process.env.REACT_APP_BACKEND_URL+'api/chat', chatData);
   
    setChats(prev => {
      // check if chat already exists in state
      const exists = prev.some(chat => chat._id === response.data._id);
      if (exists) {
        // if exists, update instead of adding duplicate
        return prev.map(chat => chat._id === response.data._id ? response.data : chat);
      }
      return [response.data, ...prev];
    });


    if (socket) {
      socket.emit("chat-created", {
        chat: response.data,
        members: response.data.members.map(m => m._id) // or just response.data.members
      });
    }


      setShowUserSearch(false);
      handleChatSelect(response.data);


      
    } catch (error) {
      console.error('Error creating chat:', error);
    }
  };

  const handleAddMembers = async (memberIds) => {
    if (!selectedChat || !selectedChat.isGroup) return;

    console.log('Frontend: Adding members', { memberIds, chatId: selectedChat._id });

    try {
      if (socket) {
        socket.emit('addGroupMembers', {
          chatId: selectedChat._id,
          memberIds
        });
      }

      setShowGroupMemberSearch(false);
    } catch (error) {
      console.error('Error adding members:', error);
      throw error;
    }
  };

  if (loading) {
    return (
      <div className="chat-loading">
        <div className="loading-spinner"></div>
        <p>Loading chats...</p>
      </div>
    );
  }

  return (
    <div className="chat-container">
      <div className="chat-sidebar">
        <ChatHeader
          user={user}
          onNewChat={() => setShowUserSearch(true)}
          onShowProfile={() => setShowProfile(true)}
          onLogout={logout}
        />
        
        <ChatList 
          chats={chats}
          selectedChat={selectedChat}
          onChatSelect={handleChatSelect}
          currentUser={user}
        />
      </div>

      <div className="chat-main">
        {selectedChat ? (
          <ChatWindow
            chat={selectedChat}
            messages={messages}
            onSendMessage={handleSendMessage}
            currentUser={user}
            socket={socket}
            onAddMembers={() => setShowGroupMemberSearch(true)}
          />
        ) : (
          <div className="no-chat-selected">
            <div className="welcome-message">
              <h2>Welcome to WhatsApp</h2>
              <p>Select a chat to start messaging</p>
            </div>
          </div>
        )}
      </div>

      {showUserSearch && (
        <UserSearch
          onClose={() => setShowUserSearch(false)}
          onCreateChat={handleCreateChat}
        />
      )}

      {showProfile && (
        <UserProfile
          onClose={() => setShowProfile(false)}
        />
      )}

      {showGroupMemberSearch && selectedChat && selectedChat.isGroup && (
        <GroupMemberSearch
          onClose={() => setShowGroupMemberSearch(false)}
          onAddMembers={handleAddMembers}
          currentMembers={selectedChat.members}
          chatId={selectedChat._id}
        />
      )}
    </div>
  );
};

export default Chat;
