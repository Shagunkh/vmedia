const mongoose = require('mongoose');

const ProjectSchema = new mongoose.Schema({
  title: String,
  description: String,
  tags: [String],
  teamSize: { type: Number, required: true },
  creator: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  joinRequests: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  teamMembers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
}, { timestamps: true });

module.exports = mongoose.model('CollabProject', ProjectSchema);
