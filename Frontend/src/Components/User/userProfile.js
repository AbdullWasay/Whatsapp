import axios from 'axios';
import { useState } from 'react';
import { useAuth } from '../../Context/authContext';
import '../../css/UserProfile.css';

const UserProfile = ({ onClose }) => {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    bio: user?.bio || ''
  });
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };



  const handleSave = async () => {
    setSaving(true);
    try {
      await axios.put(process.env.REACT_APP_BACKEND_URL+'api/user/profile', formData);
      setIsEditing(false);
      // Update user context
      window.location.reload();
    } catch (error) {
      console.error('Save failed:', error);
      alert('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      name: user?.name || '',
      bio: user?.bio || ''
    });
    setIsEditing(false);
  };

  return (
    <div className="profile-overlay">
      <div className="profile-modal">
        <div className="profile-header">
          <button className="back-button" onClick={onClose}>
            back
          </button>
          <h2>Profile</h2>
          <button 
            className="edit-button"
            onClick={() => setIsEditing(!isEditing)}
          >
            {isEditing ? 'Cancel' : 'Edit'}
          </button>
        </div>

        <div className="profile-content">
          <div className="profile-fields">
            <div className="field-group">
              <label>Name</label>
              {isEditing ? (
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="field-input"
                />
              ) : (
                <div className="field-value">{user?.name}</div>
              )}
            </div>

            <div className="field-group">
              <label>Bio</label>
              {isEditing ? (
                <textarea
                  name="bio"
                  value={formData.bio}
                  onChange={handleInputChange}
                  className="field-input bio-input"
                  rows="3"
                  maxLength="139"
                />
              ) : (
                <div className="field-value">{user?.bio}</div>
              )}
              {isEditing && (
                <div className="char-count">{formData.bio.length}/139</div>
              )}
            </div>

            <div className="field-group">
              <label>Email</label>
              <div className="field-value">{user?.email}</div>
            </div>

     
          </div>

          {isEditing && (
            <div className="profile-actions">
              <button 
                className="save-btn"
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? 'Saving...' : 'Save'}
              </button>
              <button 
                className="cancel-btn"
                onClick={handleCancel}
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
