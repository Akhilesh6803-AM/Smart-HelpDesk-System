const Notification = require('../models/Notification');

/**
 * Utility to create a notification (used internally by other controllers)
 */
const createNotification = async (userId, message, type) => {
  try {
    await Notification.create({ userId, message, type });
  } catch (err) {
    console.error('Failed to create notification:', err);
  }
};

/**
 * GET /notifications
 * Get latest 20 notifications for the current user
 */
const getMyNotifications = async (req, res, next) => {
  try {
    const notifications = await Notification.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .limit(20);

    return res.status(200).json({
      success: true,
      notifications,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * PATCH /notifications/:id/read
 * Mark single notification as read
 */
const markAsRead = async (req, res, next) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { readStatus: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }

    return res.status(200).json({ success: true, notification });
  } catch (err) {
    next(err);
  }
};

/**
 * PATCH /notifications/read-all
 * Mark all notifications for current user as read
 */
const markAllAsRead = async (req, res, next) => {
  try {
    await Notification.updateMany(
      { userId: req.user._id, readStatus: false },
      { readStatus: true }
    );

    return res.status(200).json({ success: true, message: 'All notifications marked as read' });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createNotification,
  getMyNotifications,
  markAsRead,
  markAllAsRead,
};
