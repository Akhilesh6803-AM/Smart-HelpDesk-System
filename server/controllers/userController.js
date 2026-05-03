const User = require('../models/User');
const bcrypt = require('bcrypt');

/**
 * GET /users
 * Admin only. Returns all users, supports ?role=student. Pagination ?page=1&limit=10.
 */
const getUsers = async (req, res, next) => {
  try {
    const { role, page = 1, limit = 10 } = req.query;

    const filter = {};
    if (role) filter.role = role;

    const users = await User.find(filter)
      .select('-password')
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await User.countDocuments(filter);

    return res.status(200).json({
      success: true,
      count: users.length,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / limit),
      users,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * PATCH /users/:id
 * Admin can update any user. User can update own profile only.
 * Allowed fields: name, email, password.
 * Password change requires currentPassword to verify.
 */
const updateUser = async (req, res, next) => {
  try {
    const { name, email, password, currentPassword } = req.body;
    const targetUserId = req.params.id;

    // Check permissions
    if (req.user.role !== 'admin' && req.user._id.toString() !== targetUserId) {
      return res.status(403).json({ success: false, message: 'You can only update your own profile' });
    }

    const user = await User.findById(targetUserId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Handle password update
    if (password) {
      if (!currentPassword) {
        return res.status(400).json({ success: false, message: 'Please provide currentPassword to update password' });
      }

      // Verify current password
      const isMatch = await bcrypt.compare(currentPassword, user.password);
      if (!isMatch) {
        return res.status(401).json({ success: false, message: 'Incorrect current password' });
      }

      if (password.length < 8) {
        return res.status(400).json({ success: false, message: 'New password must be at least 8 characters' });
      }

      user.password = await bcrypt.hash(password, 12);
    }

    // Update other fields
    if (name) user.name = name.trim();
    if (email) user.email = email.trim().toLowerCase();

    await user.save();

    return res.status(200).json({
      success: true,
      message: 'User updated successfully',
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ success: false, message: 'Email already exists' });
    }
    next(err);
  }
};

/**
 * DELETE /users/:id
 * Admin only
 */
const deleteUser = async (req, res, next) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    return res.status(200).json({ success: true, message: 'User deleted' });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getUsers,
  updateUser,
  deleteUser,
};
