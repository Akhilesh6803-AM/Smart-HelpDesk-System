const mongoose = require('mongoose');

const faqSchema = new mongoose.Schema({
  question: {
    type: String,
    required: [true, 'FAQ question is required'],
    trim: true,
  },
  answer: {
    type: String,
    required: [true, 'FAQ answer is required'],
  },
  category: {
    type: String,
    required: [true, 'FAQ category is required'],
    enum: [
      'Technical Issues',
      'Academic Issues',
      'Project & Documentation',
      'Administrative Issues',
      'Facility & Campus Issues',
      'Student Welfare & Complaints',
    ],
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  status: {
    type: String,
    enum: ['published', 'pending'],
    default: 'published',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('FAQ', faqSchema);
