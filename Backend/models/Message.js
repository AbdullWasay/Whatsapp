const mongoose=require ('mongoose');
const MessageSchema= mongoose.Schema({
    senderId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'User'
    },
    content :{
        type:String,
        trim:true,
        defaul:'Message'
    },
    chatId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'Chat'
    },
    messageType:{
        type:String,
        enum:['text', 'system', 'file', 'image'],
        default:'text'
    },
    systemMessageType:{
        type:String,
        enum:['member_added', 'member_removed', 'group_created'],
        required: function() {
            return this.messageType === 'system';
        }
    },
    systemMessageData:{
        addedBy: {
            type:mongoose.Schema.Types.ObjectId,
            ref:'User'
        },
        addedMembers: [{
            type:mongoose.Schema.Types.ObjectId,
            ref:'User'
        }]
    },
    createdAt:{
        type:Date,
        default:Date.now
    },
    status:{
        type:String,
        default:'delivered'
    }
})
module.exports=mongoose.model('Message',MessageSchema)  