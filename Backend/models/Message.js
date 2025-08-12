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