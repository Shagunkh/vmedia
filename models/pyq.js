const mongoose = require('mongoose');
const pyqSchema = new mongoose.Schema({
  subject: { type: String, required: true },
  
  examType: { type: String, required: true },
  slots: { type: String, required: true },
  pages: [{
    pageNumber: Number,
    fileUrl: String
  }],
  uploadedAt: { type: Date, default: Date.now }
});
module.exports = mongoose.model('PYQ', pyqSchema);