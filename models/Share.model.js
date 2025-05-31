const mongoose = require('mongoose')

const shareSchema = new mongoose.Schema({
    sender:{
        type:String,
        required:true
    },
    receiver:{
        type:String,
        required:true
    },
    album:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Album"
    }
})

module.exports = mongoose.model("ShareData",shareSchema)