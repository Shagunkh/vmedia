const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const messageSchema = new Schema({
  sender: { 
    type: Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  content: { 
    type: String, 
    required: true 
  },
  timestamp: { 
    type: Date, 
    default: Date.now 
  }
});

const groupChatSchema = new Schema({
  room: { 
    type: Schema.Types.ObjectId, 
    ref: 'Room', 
    required: true,
    unique: true 
  },
  members: [{ 
    type: Schema.Types.ObjectId, 
    ref: 'User' 
  }],
  messages: [messageSchema]
}, { timestamps: true });

module.exports = mongoose.model('GroupChat', groupChatSchema);