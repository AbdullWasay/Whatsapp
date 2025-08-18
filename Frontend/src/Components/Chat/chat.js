import axios from 'axios';
import { useEffect, useState } from 'react';
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

      socket.on('groupMembersAdded', (data) => {
        console.log('Frontend: Received groupMembersAdded event', data);

        if (selectedChat && selectedChat._id === data.chatId) {
          // Reload the selected chat to get updated member list
          loadChatDetails(data.chatId);
        }

        // Update chat list
        setChats(prev => prev.map(chat =>
          chat._id === data.chatId
            ? { ...chat, updatedAt: new Date() }
            : chat
        ));
      });

      socket.on('error', (error) => {
        console.error('Socket error:', error);
        alert(error.message || 'An error occurred');
      });

      return () => {
        socket.off('newMessage');
        socket.off('userStatusUpdate');
        socket.off('groupMembersAdded');
        socket.off('error');
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

  const loadChatDetails = async (chatId) => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_BACKEND_URL}api/chat/${chatId}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (selectedChat && selectedChat._id === chatId) {
        setSelectedChat(response.data);
      }

      // Update the chat in the chats list
      setChats(prev => prev.map(chat =>
        chat._id === chatId ? response.data : chat
      ));
    } catch (error) {
      console.error('Error loading chat details:', error);
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
