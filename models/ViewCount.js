// models/viewCount.js
const mongoose = require('mongoose');

const viewCountSchema = new mongoose.Schema({
  date: {
    type: String,
    required: true,
    unique: true
  },
  count: {
    type: Number,
    required: true,
    default: 0
  }
}, { timestamps: true });

module.exports = mongoose.model('ViewCount', viewCountSchema);