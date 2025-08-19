import { useState } from 'react';
import { useTheme } from "../../Context/themeContext";
import "../../css/ChatHeader.css";
const ChatHeader = ({ user, onNewChat, onShowProfile, onLogout }) => {
  const [showMenu, setShowMenu] = useState(false);
 const { theme, toggleTheme } = useTheme();

  const handleMenuToggle = () => {
    setShowMenu(!showMenu);
  };

  const handleMenuItemClick = (action) => {
    setShowMenu(false);
    action();
  };

  return (
    <div className="chat-headerr">
      <div className="header-left">
        <div className="user-info" onClick={() => handleMenuItemClick(onShowProfile)}>
          <div className="user-avatar">
            {user?.profilePicture ? (
           
           
              <img 
  src={`${process.env.REACT_APP_BACKEND_URL}${user.profilePicture}`} 
  alt={user.name} 
/>



            ) : (
              <div className="avatar-placeholder">
                {user?.name?.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          <span className="user-name">{user?.name}</span>
        </div>
      </div>



      <div className="header-actions">
       
         <button 
         className="action-btn new-chat-btn"
          title="Mode"
          onClick={toggleTheme}>
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
  <path d="M21 12.79A9 9 0 0111.21 3a7 7 0 000 14 9 9 0 009.79-4.21z"/>
</svg>

      </button>
       
        <button 
          className="action-btn new-chat-btn"
          onClick={onNewChat}
          title="New Chat"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M20 2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h4v3c0 .6.4 1 1 1h.5c.2 0 .5-.1.7-.3L16.5 18H20c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H16l-4 4v-4H4V4h16v12z"/>
          </svg>
        </button>

        <div className="menu-container">

          
          <button 
            className="action-btn menu-btn"
            onClick={handleMenuToggle}
            title="Menu"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/>
            </svg>
          </button>

          {showMenu && (
            <div className="dropdown-menu">
              <button 
                className="menu-item"
                onClick={() => handleMenuItemClick(onShowProfile)}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                </svg>
                Profile
              </button>
              <button 
                className="menu-item"
                onClick={() => handleMenuItemClick(onNewChat)}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20 2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h4v3c0 .6.4 1 1 1h.5c.2 0 .5-.1.7-.3L16.5 18H20c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/>
                </svg>
                New Chat
              </button>
              <div className="menu-divider"></div>
              <button 
                className="menu-item logout-item"
                onClick={() => handleMenuItemClick(onLogout)}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.59L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z"/>
                </svg>
                Log out
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatHeader;
