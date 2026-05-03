const express = require('express');
const { suggest, ask } = require('../controllers/aiController');
const { protect, optionalAuth } = require('../middleware/authMiddleware');

const router = express.Router();

// /ai/suggest — requires login (used during ticket creation)
router.post('/suggest', protect, suggest);

// /ai/ask — works for both guests and logged-in users (chatbot widget)
router.post('/ask', optionalAuth, ask);

module.exports = router;
