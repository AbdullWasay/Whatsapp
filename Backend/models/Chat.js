const mongoose = require('mongoose');
const chatSchema = mongoose.Schema({
    members:[{
        type:mongoose.Schema.Types.ObjectId,
        ref:'User',
        required:true
    }],
    isGroup:{
        type:Boolean,
        default:false
    },
    groupName:{
        type:String,
        trim:true,
        default:'Name'
    },
    lastMessage:{
        type:mongoose.Scehema.Types.ObjectId,
        ref:'Message'
    },
    updatedAt:{
        type:Date,
        default:Date.now()
    }
})


chatSchema.index({ updatedAt: -1 });
module.exports=mongoose.model('chat',chatSchema);