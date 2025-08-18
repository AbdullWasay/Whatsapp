import { useEffect, useRef, useState } from 'react';
import '../../css/ChatWindow.css';

const ChatWindow = ({ chat, messages, onSendMessage, currentUser, socket, onAddMembers }) => {
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState([]);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (socket) {
      socket.on('userTyping', (data) => {
        if (data.userId !== currentUser._id) {
          if (data.isTyping) {
            setTypingUsers(prev => [...prev.filter(u => u.userId !== data.userId), data]);
          } else {
            setTypingUsers(prev => prev.filter(u => u.userId !== data.userId));
          }
        }
      });

      return () => {
        socket.off('userTyping');
      };
    }
  }, [socket, currentUser._id]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (newMessage.trim()) {
      onSendMessage(newMessage.trim());
      setNewMessage('');
      
      // Stop typing indicator
      if (socket && isTyping) {
        socket.emit('typing', { chatId: chat._id, isTyping: false });
        setIsTyping(false);
      }
    }
  };

  const handleInputChange = (e) => {
    setNewMessage(e.target.value);
    
    if (socket) {
      if (!isTyping) {
        setIsTyping(true);
        socket.emit('typing', { chatId: chat._id, isTyping: true });
      }

      // Clear existing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      // Set new timeout to stop typing indicator
      typingTimeoutRef.current = setTimeout(() => {
        setIsTyping(false);
        socket.emit('typing', { chatId: chat._id, isTyping: false });
      }, 1000);
    }
  };

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const getChatName = () => {
    if (chat.isGroup) {
      return chat.groupName;
    } else {
      const otherMember = chat.members.find(member => member._id !== currentUser._id);
      return otherMember?.name || 'Unknown User';
    }
  };

  const getOnlineStatus = () => {
    if (chat.isGroup) return null;
    
    const otherMember = chat.members.find(member => member._id !== currentUser._id);
    if (otherMember?.status === 'online') {
      return 'online';
    } else if (otherMember?.lastSeen) {
      const lastSeen = new Date(otherMember.lastSeen);
      const now = new Date();
      const diffInMinutes = (now - lastSeen) / (1000 * 60);
      
      if (diffInMinutes < 60) {
        return `last seen ${Math.floor(diffInMinutes)} minutes ago`;
      } else if (diffInMinutes < 1440) { // 24 hours
        return `last seen ${Math.floor(diffInMinutes / 60)} hours ago`;
      } else {
        return `last seen ${lastSeen.toLocaleDateString()}`;
      }
    }
    return 'offline';
  };

  return (
    <div className="chat-window">
      <div className="chat-window-header">
        <div className="chat-info">
          <h2>{getChatName()}</h2>
          <p className="status">{getOnlineStatus()}</p>
        </div>
        {chat.isGroup && (
          <div className="header-actions">
            <button
              className="add-members-btn"
              onClick={onAddMembers}
              title="Add Members"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
              </svg>
            </button>
          </div>
        )}
      </div>

      <div className="messages-container">
        {messages.map((message, index) => {
          const isSent = message.senderId.name === currentUser.name;
          const prevMessage = messages[index - 1];
          const showAvatar = !isSent && (!prevMessage || prevMessage.senderId._id !== message.senderId._id);

          return (
            <div
              key={message._id}
              className={`message ${isSent ? 'sent' : 'received'}`}
            >
              {!isSent && (
                <div className="message-avatar">
                  {showAvatar ? (
                    message.senderId.profilePicture ? (
                      <img src={message.senderId.profilePicture} alt={message.senderId.name} />
                    ) : (
                      <div className="avatar-placeholder">
                        {message.senderId.name.charAt(0).toUpperCase()}
                      </div>
                    )
                  ) : (
                    <div className="avatar-spacer"></div>
                  )}
                </div>
              )}

              <div className="message-content">
                {!isSent && chat.isGroup && showAvatar && (
                  <div className="sender-name">{message.senderId.name}</div>
                )}
                <div className="message-text">{message.content}</div>
                <div className="message-time">{formatTime(message.createdAt)}</div>
              </div>
            </div>
          );
        })}
        
        {typingUsers.length > 0 && (
          <div className="typing-indicator">
            <div className="typing-content">
              <div className="typing-dots">
                <span></span>
                <span></span>
                <span></span>
              </div>
              <span className="typing-text">
                {typingUsers.map(u => u.userName).join(', ')} 
                {typingUsers.length === 1 ? ' is' : ' are'} typing...
              </span>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSendMessage} className="message-input-form">
        <div className="message-input-container">
          <input
            type="text"
            value={newMessage}
            onChange={handleInputChange}
            placeholder="Type a message..."
            className="message-input"
          />
          <button 
            type="submit" 
            className="send-button"
            disabled={!newMessage.trim()}
          >
            ➤
          </button>
        </div>
      </form>
    </div>
  );
};

export default ChatWindow;
