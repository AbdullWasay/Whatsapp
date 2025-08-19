import axios from 'axios';
import { useEffect, useState } from 'react';
import '../../css/GroupMemberSearch.css';

const GroupMemberSearch = ({ onClose, onAddMembers, currentMembers, chatId }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState([]);

  useEffect(() => {
    console.log('GroupMemberSearch: Current members:', currentMembers);
  }, [currentMembers]);

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
      
      // Filter out users who are already members
      console.log('Search response users:', response.data.map(u => ({ id: u._id, name: u.name })));
      console.log('Current members for filtering:', currentMembers.map(m => ({ id: m._id, name: m.name })));

      const filteredUsers = response.data.filter(user =>
        !currentMembers.some(member => member._id === user._id)
      );

      console.log('Filtered users after removing current members:', filteredUsers.map(u => ({ id: u._id, name: u.name })));
      setUsers(filteredUsers);
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
      
      // Filter out users who are already members
      console.log('Load all users response:', response.data.map(u => ({ id: u._id, name: u.name })));

      const filteredUsers = response.data.filter(user =>
        !currentMembers.some(member => member._id === user._id)
      );

      console.log('Filtered users (load all):', filteredUsers.map(u => ({ id: u._id, name: u.name })));
      setUsers(filteredUsers);
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

  const handleAddMembers = async () => {
    if (selectedUsers.length === 0) {
      alert('Please select at least one user to add');
      return;
    }

    console.log('Selected users to add:', selectedUsers.map(u => ({ id: u._id, name: u.name })));
    console.log('Current members:', currentMembers.map(m => ({ id: m._id, name: m.name })));

    try {
      await onAddMembers(selectedUsers.map(u => u._id));
      onClose();
    } catch (error) {
      console.error('Error adding members:', error);
      alert('Failed to add members. Please try again.');
    }
  };

  return (
    <div className="group-member-search-overlay">
      <div className="group-member-search-modal">
        <div className="group-member-search-header">
          <h2>Add Group Members</h2>
          <button className="close-button-group" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="search-section">
          <input
            type="text"
            placeholder="Search users..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
        </div>

        {selectedUsers.length > 0 && (
          <div className="selected-users">
            <h3>Selected Users ({selectedUsers.length})</h3>
            <div className="selected-users-list">
              {selectedUsers.map(user => (
                <div key={user._id} className="selected-user-item">
                  <div className="user-avatar">
                    <div className="avatar-placeholder">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                  </div>
                  <span className="user-name">{user.name}</span>
                  <button 
                    className="remove-user-btn"
                    onClick={() => handleUserSelect(user)}
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="users-list">
          {loading ? (
            <div className="loading">Loading users...</div>
          ) : users.length === 0 ? (
            <div className="no-users">
              {searchQuery ? 'No users found' : 'No users available to add'}
            </div>
          ) : (
            users.map(user => (
              <div
                key={user._id}
                className={`user-item ${selectedUsers.find(u => u._id === user._id) ? 'selected' : ''}`}
                onClick={() => handleUserSelect(user)}
              >
                <div className="user-avatar">
                  <div className="avatar-placeholder">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                </div>
                <div className="user-info">
                  <h4>{user.name}</h4>
                  <p>{user.email}</p>
                  {user.bio && <p className="user-bio">{user.bio}</p>}
                </div>
                <div className="user-status">
                  <span className={`status-indicator ${user.status}`}></span>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="actions-group">
          <button
            className="add-members-btn-group"
            onClick={handleAddMembers}
            disabled={selectedUsers.length === 0}
          >
            Add {selectedUsers.length} Member{selectedUsers.length !== 1 ? 's' : ''}
          </button>
        </div>
      </div>
    </div>
  );
};

export default GroupMemberSearch;
