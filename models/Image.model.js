const mongoose = require('mongoose');
const {v4:uuidv4} = require('uuid')

const imageSchema = new mongoose.Schema({
  imageId: {
    type: String,
    default:uuidv4,
    unique: true
  },
  albumId: {
    type: String,
    required: true,
    ref: 'Album'
  },
  imageUrl:{type:String,required:true},
  name: {
    type: String,
  },
  tags: [String],
  person: {
    type: String,
    default: null
  },
  isFavorite: {
    type: Boolean,
    default: false
  },
  comments: [String],
  size: {
    type: Number,
    required: true
  },
  uploadedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('ImageV2', imageSchema);
