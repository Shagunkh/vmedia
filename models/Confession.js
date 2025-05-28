const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  text: { type: String, required: true, maxlength: 200 },
  createdAt: { type: Date, default: Date.now }
});

const confessionSchema = new mongoose.Schema({
  text: { type: String, required: true, maxlength: 500 },
  category: { type: String, default: 'general' },
  reactions: {
    like: { type: Number, default: 0 },
    hug: { type: Number, default: 0 },
    sad: { type: Number, default: 0 }
  },
  comments: [commentSchema], // Add comments array
  createdAt: { type: Date, default: Date.now },
  reactedBy: {
    type: Map,
    of: [String],
    default: {},
  }
});

module.exports = mongoose.model('Confession', confessionSchema);
