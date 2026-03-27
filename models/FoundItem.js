const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const foundItemSchema = new Schema({
  itemName: { type: String, required: true },
  foundLocation: { type: String, required: true },
  dateFound: { type: Date, required: true },
  description: { type: String, required: true },
  image: {
    public_id: String,
    url: String
  },
  contactInfo: { type: String, required: true },
  postedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  createdAt: { type: Date, default: Date.now, expires: '2d' }
});

module.exports = mongoose.model('FoundItem', foundItemSchema);