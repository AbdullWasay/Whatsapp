const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const UserSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password:{
        type: String,
        required: true
    },
    bio: { 
        type: String, 
        default: "Hey! I am using whatsapp" 
    },
    status: { 
        type: String, 
        default: "Offline" 
    },
    lastSeen:{
        type: Date,
        default: Date.now()
    },
    profilePicture:{
        type: String,
        default: ''
    } 
});

// Hash password before saving
UserSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();
    
   
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
   
});

// Method to compare password
UserSchema.methods.comparePassword = async function(candidatePassword) {

        return await bcrypt.compare(candidatePassword, this.password);
  
};

  
module.exports = mongoose.model('User', UserSchema);

