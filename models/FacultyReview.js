// models/FacultyReview.js
const mongoose = require('mongoose');

const facultyReviewSchema = new mongoose.Schema({
  facultyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Faculty', required: true },
  reviewerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  rating: { type: Number, min: 1, max: 5, required: true },
  reviewText: { type: String, required: true }
}, { timestamps: true });

module.exports = mongoose.model('FacultyReview', facultyReviewSchema);
