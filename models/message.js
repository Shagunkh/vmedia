const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema({
  username: String,
  text: String,
  room: {
    type: String,
    default: 'general'
  },
  createdAt: {
    type: Date,
    default: Date.now,
     expires: 60 * 60 * 6 // TTL: expires 60 seconds (1 minute) after creation
  }
});

module.exports = mongoose.model("Message", messageSchema);
