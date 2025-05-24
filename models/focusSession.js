const mongoose = require('mongoose');

const focusSessionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  duration: {
    type: Number, // in minutes
    required: true
  },
  startedAt: {
    type: Date,
    default: Date.now
  },
  endedAt: {
    type: Date
  },
  completed: {
    type: Boolean,
    default: false
  }
});

module.exports = mongoose.model('FocusSession', focusSessionSchema);