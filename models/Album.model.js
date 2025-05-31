const mongoose = require('mongoose')

const albumSchema = new mongoose.Schema({
    name:{
        type:String,required:true
    },
    description:{
        type:String,required:true
    },
    ownerId:{
        type:String,
        required:true
    },
    sharedUser:[{
        type:String,
    }]
})  

module.exports = mongoose.model("Album",albumSchema)