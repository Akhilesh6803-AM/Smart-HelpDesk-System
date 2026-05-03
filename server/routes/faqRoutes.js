const express = require('express');
const { getFAQs, createFAQ, updateFAQ, deleteFAQ } = require('../controllers/faqController');
const { protect, restrictTo } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/', getFAQs); // Public

// Protected Staff and Admin Routes
router.use(protect);
router.post('/', restrictTo('staff', 'admin'), createFAQ);

// Protected Admin Routes
router.patch('/:id', restrictTo('admin'), updateFAQ);
router.delete('/:id', restrictTo('admin'), deleteFAQ);

module.exports = router;
