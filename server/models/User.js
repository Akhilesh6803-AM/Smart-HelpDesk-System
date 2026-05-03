const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email address'],
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [8, 'Password must be at least 8 characters'],
  },
  role: {
    type: String,
    enum: ['student', 'staff', 'admin'],
    required: [true, 'Role is required'],
  },
  // Students only — must be exactly 10 characters
  usn: {
    type: String,
    unique: true,
    sparse: true, // allows multiple nulls
    trim: true,
    uppercase: true,
    validate: {
      validator: function (v) {
        // Only validate if provided
        return !v || v.length === 10;
      },
      message: 'USN must be exactly 10 characters',
    },
  },
  // Staff / Admin only
  employeeId: {
    type: String,
    unique: true,
    sparse: true,
    trim: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('User', userSchema);
