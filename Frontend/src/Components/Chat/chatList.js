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

  const getProfilePicture = (chat) => {
    if (chat.isGroup) {
      return process.env.REACT_APP_BACKEND_URL + 'assets/group.png';
    } else {
      const otherMember = chat.members.find(member => member.name !== currentUser.name);
      if (otherMember?.profilePicture) {
        return `${process.env.REACT_APP_BACKEND_URL}${otherMember.profilePicture}`;
      }
      return null;
    }
  };

  const getLastMessageContent = (chat) => {
    if (chat.lastMessage?.messageId) {
      return chat.lastMessage.messageId.content || 'New message';
    }
    return 'No messages yet';
  };

  const getLastMessageStatus = (chat) => {
    if (chat.lastMessage?.messageId) {
      return chat.lastMessage.messageId.status || 'unknown';
    }
    return 'unknown';
  };

  const getLastMessageSenderId = (chat) => {
    
  if (chat.lastMessage?.messageId) {
    return chat.lastMessage.messageId.senderId._id || chat.lastMessage.messageId.senderId ;
  }
  return null;
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
        chats.map(chat => {
          const status = getLastMessageStatus(chat);
          const message = getLastMessageContent(chat);
        
          return (
            <div
              key={chat._id}
              className={`chat-item ${selectedChat?._id === chat._id ? 'selected' : ''}`}
                onClick={() => {
    onChatSelect(chat);
  }}
            >
              <div className="chat-avatar-wrapper">
                <div className="chat-avatar">
                  {getProfilePicture(chat) ? (
                    <img src={getProfilePicture(chat)} alt="profile" />
                  ) : (
                    <div className="avatar-placeholder">
                      {getChatName(chat).charAt(0).toUpperCase()}
                    </div>
                  )}
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
               

<p
  className={
    getLastMessageSenderId(chat) === currentUser.id
      ? "last-message" 
      : status === "delivered"
        ? "unread-message"   : "last-message"
  }
>
  {message}
</p>




              </div>
            </div>
          );
        })
      )}
    </div>
  );
};

export default ChatList;
