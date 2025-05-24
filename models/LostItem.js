const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const lostItemSchema = new Schema({
  itemName: { type: String, required: true },
  lastSeenLocation: { type: String, required: true },
  dateLost: { type: Date, required: true },
  description: { type: String, required: true },
  image: {
    public_id: String,
    url: String
  },
  contactInfo: { type: String, required: true },
  postedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  createdAt: { type: Date, default: Date.now, expires: '5d' }
});

module.exports = mongoose.model('LostItem', lostItemSchema);