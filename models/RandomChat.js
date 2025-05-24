const mongoose = require('mongoose');

const randomChatSchema = new mongoose.Schema({
  participants: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }],
  messages: [{
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    content: {
      type: String,
      required: true
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  startedAt: {
    type: Date,
    default: Date.now
  },
  endedAt: {
    type: Date
  }
});

module.exports = mongoose.model('RandomChat', randomChatSchema);