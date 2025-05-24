const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema({
  subject: String,
  topic: String,
  plannedDate: Date,
  status: { type: String, enum: ['pending', 'done', 'missed'], default: 'pending' }
});

const plannerSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  examDate: Date,
  dailyHours: Number,
  sessions: [sessionSchema]
});

module.exports = mongoose.model('Planner', plannerSchema);