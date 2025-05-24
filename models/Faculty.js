const mongoose = require('mongoose');

const facultySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true
  },
  department: String,
  email: String,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Create text index for search
facultySchema.index({ name: 'text', department: 'text' });

module.exports = mongoose.model('Faculty', facultySchema);