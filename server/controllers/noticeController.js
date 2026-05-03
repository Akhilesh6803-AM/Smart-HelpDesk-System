const Notice = require('../models/Notice');

/**
 * GET /notices
 * Public route to get all notices, latest first
 */
const getNotices = async (req, res, next) => {
  try {
    const notices = await Notice.find()
      .sort({ createdAt: -1 })
      .populate('createdBy', 'name email role');

    return res.status(200).json({ success: true, count: notices.length, notices });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /notices
 * Admin only
 */
const createNotice = async (req, res, next) => {
  try {
    const { title, description } = req.body;

    if (!title || !description) {
      return res.status(400).json({ success: false, message: 'Title and description are required' });
    }

    const notice = await Notice.create({
      title,
      description,
      createdBy: req.user._id,
    });

    return res.status(201).json({ success: true, message: 'Notice created', notice });
  } catch (err) {
    next(err);
  }
};

/**
 * PATCH /notices/:id
 * Admin only
 */
const updateNotice = async (req, res, next) => {
  try {
    const { title, description } = req.body;

    const notice = await Notice.findById(req.params.id);
    if (!notice) {
      return res.status(404).json({ success: false, message: 'Notice not found' });
    }

    if (title) notice.title = title;
    if (description) notice.description = description;
    notice.updatedAt = Date.now();

    await notice.save();

    return res.status(200).json({ success: true, message: 'Notice updated', notice });
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /notices/:id
 * Admin only
 */
const deleteNotice = async (req, res, next) => {
  try {
    const notice = await Notice.findByIdAndDelete(req.params.id);

    if (!notice) {
      return res.status(404).json({ success: false, message: 'Notice not found' });
    }

    return res.status(200).json({ success: true, message: 'Notice deleted' });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getNotices,
  createNotice,
  updateNotice,
  deleteNotice,
};
