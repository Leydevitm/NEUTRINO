
const mongoose = require('mongoose');

const VerificationCode = new mongoose.Schema({

    phone:{
        type: String,
        required: true,
        index: true
    },
    code:{
        type:String,
        required: true
    },
    provider:{
        type:String, 
        enum: ['Vonage', 'Neutrino'],
        required: true
    },
    status: {
        type: String, 
        enum: ['pendiente', 'verificado'],
        default: 'pendiente'
    },
    createdAt:{
        type:Date, 
        default: Date.now
    },
    expiresAt: {
       type: Date,
       required: true
    },
    updatedAt: {
        type:Date,
        default:Date.now
        
    },
    filedAttempts:{
        type: Number,
        default: 0
    },
    verifiedAt: Date

},{ timestamps: true }); 

//se elimina 60 seg despues de que expire 
VerificationCode.index({expiresAt:1}, {expireAfterSeconds:60});

VerificationCode.pre('save', function(next){
    this.updatedAt= new Date();
    next();
});



module.exports = mongoose.model('VerificationCode', VerificationCode);