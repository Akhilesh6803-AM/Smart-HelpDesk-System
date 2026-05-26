const express = require('express');
const rateLimit = require('express-rate-limit');
const { register, login, logout, getMe, seedAdmin, verifyOTP, resendOTP } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// ── Rate limiter for login — max 10 requests per 15 min per IP ──
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many login attempts from this IP. Please try again after 15 minutes.',
  },
});

// ── Routes ──
router.post('/register',   register);
// router.post('/login',      loginLimiter, login);
router.post('/login',      login);
router.post('/logout',     logout);
router.get('/me',          protect, getMe);
router.post('/seed-admin', seedAdmin);
router.post('/verify-otp', verifyOTP);
router.post('/resend-otp', resendOTP);

module.exports = router;
