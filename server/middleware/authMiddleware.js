const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * protect — verifies JWT from httpOnly cookie and attaches user to req.user.
 * Must be used before any route that requires authentication.
 */
const protect = async (req, res, next) => {
  try {
    const token = req.cookies?.token;

    if (!token) {
      return res.status(401).json({ success: false, message: 'Not authenticated. Please log in.' });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Fetch user (exclude password from the document)
    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
      return res.status(401).json({ success: false, message: 'User no longer exists.' });
    }

    req.user = user;
    next();
  } catch (err) {
    // Handle expired / invalid tokens
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'Session expired. Please log in again.' });
    }
    return res.status(401).json({ success: false, message: 'Invalid token. Please log in again.' });
  }
};

/**
 * optionalAuth — attaches user to req.user if a valid token exists,
 * but allows the request through even if there is no token (guest mode).
 */
const optionalAuth = async (req, res, next) => {
  try {
    const token = req.cookies?.token;
    if (!token) return next(); // guest — continue without user

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');
    if (user) req.user = user;
    next();
  } catch {
    next(); // invalid token — treat as guest
  }
};

/**
 * restrictTo — role-based access guard.
 * Usage: restrictTo('admin', 'staff')
 */
const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Requires one of: ${roles.join(', ')}`,
      });
    }
    next();
  };
};

module.exports = { protect, optionalAuth, restrictTo };

