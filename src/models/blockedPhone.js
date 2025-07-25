
const mongoose = require('mongoose');

const blockedPhone = new mongoose.Schema({
    phone:{
        type: String,
        required:true,
        unique: true
    },
    locked_at:{
        type: Date, 
        required:true
    },
    unlocked_at:{
        type:Date,
        required:true
    },
    recurrences:{
        type:Number,
        default:1
    }
});

blockedPhone.index({unlocked_at:1}, {expireAfterSeconds:0});

module.exports= mongoose.model('blockedPhone', blockedPhone)

