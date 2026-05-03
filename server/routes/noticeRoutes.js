const express = require('express');
const { getNotices, createNotice, updateNotice, deleteNotice } = require('../controllers/noticeController');
const { protect, restrictTo } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/', getNotices); // Public

// Protected Admin Routes
router.use(protect);
router.use(restrictTo('admin'));

router.post('/', createNotice);
router.patch('/:id', updateNotice);
router.delete('/:id', deleteNotice);

module.exports = router;
