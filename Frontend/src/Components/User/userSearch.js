import axios from 'axios';
import { useEffect, useState } from 'react';
import '../../css/UserSearch.css';
const UserSearch = ({ onClose, onCreateChat }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [showGroupForm, setShowGroupForm] = useState(false);
  const [groupData, setGroupData] = useState({
    name: '',
    picture: null
  });

  useEffect(() => {
    if (searchQuery.trim()) {
      searchUsers();
    } else {
      loadAllUsers();
    }
  }, [searchQuery]);

  const searchUsers = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${process.env.REACT_APP_BACKEND_URL}api/user/search?query=${encodeURIComponent(searchQuery)}`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      setUsers(response.data);
    } catch (error) {
      console.error('Error searching users:', error);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const loadAllUsers = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${process.env.REACT_APP_BACKEND_URL}api/user`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      setUsers(response.data);
    } catch (error) {
      console.error('Error loading users:', error);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleUserSelect = (user) => {
    if (selectedUsers.find(u => u._id === user._id)) {
      // Remove user from selection
      setSelectedUsers(selectedUsers.filter(u => u._id !== user._id));
    } else {
      // Add user to selection
      setSelectedUsers([...selectedUsers, user]);
    }
  };

  const handleCreateChat = () => {
    if (selectedUsers.length === 1) {
      // Create individual chat
      onCreateChat(selectedUsers[0]._id, false);
    } else if (selectedUsers.length > 1) {
      // Show group creation form
      setShowGroupForm(true);
    }
  };

  const handleCreateGroup = async () => {
    if (!groupData.name.trim()) {
      alert('Please enter a group name');
      return;
    }

    try {
   
    
      // Create group chat
      onCreateChat(selectedUsers.map(u => u._id), true, groupData.name);
    } catch (error) {
      console.error('Group creation failed:', error);
    }
  };

  const handleGroupDataChange = (field, value) => {
    setGroupData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  if (showGroupForm) {
    return (
      <div className="user-search-overlay">
        <div className="user-search-modal">
          <div className="user-search-header">
            <button className="back-button" onClick={() => setShowGroupForm(false)}>
              ←
            </button>
            <h2>New Group</h2>
            <button className="close-button" onClick={onClose}>
              ✕
            </button>
          </div>

        
            <div className="group-name-section">
              <input
                type="text"
                placeholder="Group name"
                value={groupData.name}
                onChange={(e) => handleGroupDataChange('name', e.target.value)}
                className="group-name-input"
                maxLength="25"
              />
            </div>

            <div className="selected-users">
              <h3>Participants: {selectedUsers.length}</h3>
              <div className="selected-users-list">
                {selectedUsers.map(user => (
                  <div key={user._id} className="selected-user-item">
                    <div className="user-avatar">
                      
                        <div className="avatar-placeholder">
                          {user.name.charAt(0).toUpperCase()}
                        </div>
                      
                    </div>
                    <span className="user-name">{user.name}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="group-actions">
              <button
                className="create-group-btn"
                onClick={handleCreateGroup}
                disabled={!groupData.name.trim()}
              >
                Create Group
              </button>
            </div>
          </div>
        </div>

    );
  }

  return (
    <div className="user-search-overlay">
      <div className="user-search-modal">
        <div className="user-search-header">
          <h2>Select Contact</h2>
          <button className="close-button" onClick={onClose}>
            ✕
          </button>
        </div>

        {selectedUsers.length > 0 && (
          <div className="selected-count">
            {selectedUsers.length} selected
            <button
              className="next-button"
              onClick={handleCreateChat}
            >
              {selectedUsers.length === 1 ? 'Chat' : 'Next'}
            </button>
          </div>
        )}

        <div className="search-input-container">
          <input
            type="text"
            placeholder="Search users..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
            autoFocus
          />
        </div>

        <div className="users-list">
          {loading ? (
            <div className="loading">Searching...</div>
          ) : users.length === 0 ? (
            <div className="no-users">
              {searchQuery ? 'No users found' : 'No users available'}
            </div>
          ) : (
            users.map(user => {
              const isSelected = selectedUsers.find(u => u._id === user._id);
              return (
                <div
                  key={user._id}
                  className={`user-item ${isSelected ? 'selected' : ''}`}
                  onClick={() => handleUserSelect(user)}
                >
                  <div className="user-avatar">
                    
                      <div className="avatar-placeholder">
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                    
                    {user.status === 'online' && <div className="online-indicator"></div>}
                  </div>
                  <div className="user-info">
                    <h3>{user.name}</h3>
                    <p>{user.bio}</p>
                  </div>
                  {isSelected && (
                    <div className="selection-indicator">
                      ✓
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default UserSearch;
