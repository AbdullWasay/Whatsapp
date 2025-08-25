import axios from 'axios';
import { useState } from 'react';
import { useAuth } from '../../Context/authContext';
import '../../css/UserProfile.css';

const UserProfile = ({ onClose }) => {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    bio: user?.bio || '',
    profilePicture: null
  });
  const [preview, setPreview] = useState(
    user?.profilePicture ? `${process.env.REACT_APP_BACKEND_URL}${user.profilePicture}` : null
  );
  const [saving, setSaving] = useState(false);

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleImageChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFormData({ ...formData, profilePicture: e.target.files[0] });
      setPreview(URL.createObjectURL(e.target.files[0]));
    }
  };

 

  const handleSave = async () => {
    setSaving(true);
    try {
      const data = new FormData();
      data.append("name", formData.name);
      data.append("bio", formData.bio);
      if (formData.profilePicture) {
        data.append("profilePicture", formData.profilePicture);
      }

      await axios.put(
        `${process.env.REACT_APP_BACKEND_URL}api/user/profile`,
        data,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );

      setIsEditing(false);
      window.location.reload(); // reload to reflect new pic
    } catch (error) {
      console.error('Save failed:', error);
      alert('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="profile-overlay">
      <div className="profile-modal">
        <div className="profile-header">

          {!isEditing && (
              <button className="edit-button" onClick={onClose}>back</button>
         
            )}
          <h2>Profile</h2>
          <button className="edit-button" onClick={() => setIsEditing(!isEditing)}>
            {isEditing ? 'Cancel' : 'Edit'}
          </button>
        </div>

        <div className="profile-content">
<div className="profile-picture">
<img 
  src={preview || (process.env.REACT_APP_BACKEND_URL + 'assets/upload.png')} 
  alt="Profile" 
/>

  {isEditing && (
    <>
      <div className="upload-overlay" onClick={() => document.getElementById("fileInput").click()}>
        <i className="fas fa-camera upload-icon"></i>
      </div>
      <input
        id="fileInput"
        type="file"
        accept="image/png,image/jpeg"
        onChange={handleImageChange}
        style={{ display: "none" }}
      />
    </>
  )}
</div>


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
              <button className="save-btn" onClick={handleSave} disabled={saving}>
                {saving ? 'Saving...' : 'Save'}
              </button>
              <button className="cancel-btn" onClick={() => setIsEditing(false)}>
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
