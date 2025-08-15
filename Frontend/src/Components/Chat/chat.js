import axios from 'axios';
import { useEffect, useState } from 'react';
import { useAuth } from '../../Context/authContext';
import { useSocket } from '../../Context/socketContext';
import '../../css/Chat.css';
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
  const [loading, setLoading] = useState(true);
const token = localStorage.getItem('token'); // Or however you're storing it
  const { user, logout } = useAuth();
  const { socket } = useSocket();

  useEffect(() => {
    loadChats();
  }, []);

  useEffect(() => {
    if (socket) {
      socket.on('newMessage', (message) => {
        if (selectedChat && message.chatId === selectedChat._id) {
          setMessages(prev => [...prev, message]);
        }
        
        // Update chat list with new message
        setChats(prev => prev.map(chat => 
          chat._id === message.chatId 
            ? { ...chat, lastMessage: { messageId: message }, updatedAt: new Date() }
            : chat
        ));
      });

      socket.on('userStatusUpdate', (data) => {
        setChats(prev => prev.map(chat => ({
          ...chat,
          members: chat.members.map(member => 
            member._id === data.userId 
              ? { ...member, status: data.status, lastSeen: data.lastSeen }
              : member
          )
        })));
      });

      return () => {
        socket.off('newMessage');
        socket.off('userStatusUpdate');
      };
    }
  }, [socket, selectedChat]);

  const loadChats = async () => {
    try {
      const response = await axios.get(process.env.REACT_APP_BACKEND_URL+'api/chat', {
  headers: {
    Authorization: `Bearer ${token}`
  }
});
      setChats(response.data);
    } catch (error) {
      console.error('Error loading chats:', error);
    } finally {
      setLoading(false);
    }
  };

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

      setChats(prev => [response.data, ...prev]);
      setShowUserSearch(false);
      handleChatSelect(response.data);
    } catch (error) {
      console.error('Error creating chat:', error);
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
    </div>
  );
};

export default Chat;
