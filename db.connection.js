const mongoose = require("mongoose")
require("dotenv").config()
const mongoURI = process.env.MONGODB

const initializeDatabase = async()=>{
    await mongoose.connect(mongoURI).then(()=>console.log("Connected to DB")).catch((error)=>console.error("Error while db connection",error))
}

module.exports = {initializeDatabase}