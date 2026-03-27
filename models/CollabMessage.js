const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const messageSchema = new Schema({
  project: { type: Schema.Types.ObjectId, ref: 'CollabProject' },
  user: { type: Schema.Types.ObjectId, ref: 'User' },
  text: String,
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('CollabMessage', messageSchema);
