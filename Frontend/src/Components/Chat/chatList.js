import '../../css/ChatList.css';

const ChatList = ({ chats, selectedChat, onChatSelect, currentUser }) => {
  const formatTime = (date) => {
    const now = new Date();
    const messageDate = new Date(date);
    const diffInHours = (now - messageDate) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return messageDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 168) { // 7 days
      return messageDate.toLocaleDateString([], { weekday: 'short' });
    } else {
      return messageDate.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  const getChatName = (chat) => {
    if (chat.isGroup) {
      return chat.groupName;
    } else {
      const otherMember = chat.members.find(member => member.name !== currentUser.name);
      return otherMember?.name || 'Unknown User';
    }
  };



  const getLastMessage = (chat) => {
    if (chat.lastMessage && chat.lastMessage.messageId) {
      return chat.lastMessage.messageId.content || 'New message';
    }
    return 'No messages yet';
  };

  const getOnlineStatus = (chat) => {
    if (chat.isGroup) return null;
    
    const otherMember = chat.members.find(member => member.name !== currentUser.name);
    return otherMember?.status === 'online';
  };

  return (
    <div className="chat-list">
      {chats.length === 0 ? (
        <div className="no-chats">
          <p>No chats yet</p>
          <p>Start a new conversation!</p>
        </div>
      ) : (
        chats.map(chat => (
          <div
            key={chat._id}
            className={`chat-item ${selectedChat?._id === chat._id ? 'selected' : ''}`}
            onClick={() => onChatSelect(chat)}
          >
            <div className="chat-avatar">
             
                <div className="avatar-placeholder">
                  {getChatName(chat).charAt(0).toUpperCase()}
                </div>
            
              {getOnlineStatus(chat) && <div className="online-indicator"></div>}
            </div>
            
            <div className="chat-info">
              <div className="chat-header-2">
                <h3 className={`chat-name ${chat.isGroup ? 'group' : ''}`}>
                  {getChatName(chat)}
                </h3>
                <span className="chat-time">
                  {chat.updatedAt && formatTime(chat.updatedAt)}
                </span>
              </div>
              <p className="last-message">{getLastMessage(chat)}</p>
            </div>
          </div>
        ))
      )}
    </div>
  );
};

export default ChatList;
