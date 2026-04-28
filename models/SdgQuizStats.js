const mongoose = require('mongoose');

const sdgQuizStatSchema = new mongoose.Schema({
  page: {
    type: String,
    required: true,
    default: 'sdg-quiz',
    unique: true
  },
  views: {
    type: Number,
    required: true,
    default: 0
  }
}, { timestamps: true });

module.exports = mongoose.model('SdgQuizStat', sdgQuizStatSchema);
