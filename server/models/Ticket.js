const mongoose = require('mongoose');

// A single message in the AI conversation thread
const messageSchema = new mongoose.Schema({
  role: {
    type: String,
    enum: ['user', 'ai'],
    required: true,
  },
  content: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
}, { _id: false });

const ticketSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: [
      'Technical Issues',
      'Academic Issues',
      'Project & Documentation',
      'Administrative Issues',
      'Facility & Campus Issues',
      'Student Welfare & Complaints',
    ],
  },
  status: {
    type: String,
    enum: ['Open', 'In Progress', 'Escalated', 'Closed'],
    default: 'Open',
  },
  priority: {
    type: String,
    enum: ['Low', 'Medium', 'High', 'Critical'],
    default: 'Low',
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },

  // ── AI Conversation Thread ────────────────────────────────────────────────
  // Stores alternating user/ai messages (max 4 AI replies)
  conversation: {
    type: [messageSchema],
    default: [],
  },
  // How many times the AI has responded (max 4)
  aiAttempts: {
    type: Number,
    default: 0,
  },
  // Whether the AI conversation is still active (false = escalated or closed by user)
  aiActive: {
    type: Boolean,
    default: true,
  },

  // Legacy single-response fields kept for backward compat
  aiResponse: {
    type: String,
    default: '',
  },
  adminResponse: {
    type: String,
    default: '',
  },

  isSensitive: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Ticket', ticketSchema);
