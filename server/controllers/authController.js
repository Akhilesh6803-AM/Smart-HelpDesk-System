const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// ─── Helpers ────────────────────────────────────────────────────────────────

const SALT_ROUNDS = 12;
const COOKIE_MAX_AGE = 7 * 24 * 60 * 60 * 1000; // 7 days in ms

/**
 * Sign a JWT and attach it as an httpOnly cookie on the response.
 */
const sendTokenCookie = (res, userId, role) => {
  const token = jwt.sign({ id: userId, role }, process.env.JWT_SECRET, {
    expiresIn: '7d',
  });

  res.cookie('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
    maxAge: COOKIE_MAX_AGE,
  });
};

// ─── Controllers ────────────────────────────────────────────────────────────

/**
 * POST /auth/register
 * Roles allowed: student | staff  (admin created via seed only)
 */
const register = async (req, res, next) => {
  try {
    const { name, email, password, role, organizationType, organizationName, identifier } = req.body;

    // ── Basic validation ──
    if (!name || !email || !password || !role || !organizationType || !organizationName) {
      return res.status(400).json({ success: false, message: 'name, email, password, role, organizationType, and organizationName are required.' });
    }

    const trimmedName     = name.trim();
    const trimmedEmail    = email.trim().toLowerCase();
    const trimmedPassword = password.trim();
    const trimmedRole     = role.trim().toLowerCase();
    const trimmedOrgType  = organizationType.trim().toLowerCase();
    const trimmedOrgName  = organizationName.trim();
    const trimmedIdentifier = identifier ? identifier.trim() : undefined;

    if (!['college', 'company'].includes(trimmedOrgType)) {
      return res.status(400).json({ success: false, message: 'organizationType must be "college" or "company".' });
    }

    if (!['student', 'staff', 'admin', 'employee'].includes(trimmedRole)) {
      return res.status(400).json({ success: false, message: 'Invalid role.' });
    }

    if (trimmedPassword.length < 8) {
      return res.status(400).json({ success: false, message: 'Password must be at least 8 characters.' });
    }

    // ── Role-specific field checks ──
    if (trimmedRole === 'student' || trimmedRole === 'employee' || trimmedRole === 'staff') {
      if (!trimmedIdentifier) {
        return res.status(400).json({ success: false, message: 'Identifier is required for this role.' });
      }
    }

    if (trimmedOrgType === 'college' && !['student', 'staff'].includes(trimmedRole)) {
      return res.status(400).json({ success: false, message: 'For college, role must be student or staff.' });
    }

    if (trimmedOrgType === 'company' && !['employee', 'admin'].includes(trimmedRole)) {
      return res.status(400).json({ success: false, message: 'For company, role must be employee or admin.' });
    }

    // ── Duplicate check ──
    const existingUser = await User.findOne({ email: trimmedEmail });
    if (existingUser) {
      return res.status(409).json({ success: false, message: 'An account with this email already exists.' });
    }

    if (trimmedIdentifier) {
      const existingIdentifier = await User.findOne({ organizationType: trimmedOrgType, identifier: trimmedIdentifier });
      if (existingIdentifier) {
        return res.status(409).json({ success: false, message: 'An account with this identifier already exists in this organization.' });
      }
    }

    // ── Hash password ──
    const hashedPassword = await bcrypt.hash(trimmedPassword, SALT_ROUNDS);

    // ── Build user document ──
    const userData = {
      name: trimmedName,
      email: trimmedEmail,
      password: hashedPassword,
      role: trimmedRole,
      organizationType: trimmedOrgType,
      organizationName: trimmedOrgName,
      identifier: trimmedIdentifier
    };

    const newUser = await User.create(userData);

    return res.status(201).json({
      success: true,
      message: 'Account created successfully. Please log in.',
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        organizationType: newUser.organizationType,
        organizationName: newUser.organizationName,
        identifier: newUser.identifier
      }
    });
  } catch (err) {
    // Mongoose duplicate key error
    if (err.code === 11000) {
      const field = Object.keys(err.keyValue)[0];
      return res.status(409).json({ success: false, message: `An account with this ${field} already exists.` });
    }
    next(err);
  }
};

/**
 * POST /auth/login
 * Accepts USN, employeeId, OR email as identifier.
 */
const login = async (req, res, next) => {
  try {
    const { emailOrIdentifier, password } = req.body;

    if (!emailOrIdentifier || !password) {
      return res.status(400).json({ success: false, message: 'emailOrIdentifier and password are required.' });
    }

    const trimmedId  = emailOrIdentifier.trim();
    const trimmedPwd = password.trim();

    const user = await User.findOne({
      $or: [
        { email: trimmedId.toLowerCase() },
        { identifier: trimmedId },
        { usn: trimmedId.toUpperCase() },
        { employeeId: trimmedId }
      ]
    });

    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    }

    const isMatch = await bcrypt.compare(trimmedPwd, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    }

    // Set JWT in httpOnly cookie — never send in body
    sendTokenCookie(res, user._id, user.role);

    return res.status(200).json({
      success: true,
      message: 'Logged in successfully.',
      user: {
        _id:   user._id,
        name:  user.name,
        email: user.email,
        role:  user.role,
        organizationType: user.organizationType,
        organizationName: user.organizationName,
        identifier: user.identifier || user.usn || user.employeeId
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /auth/logout
 * Clears the token cookie.
 */
const logout = (req, res) => {
  res.clearCookie('token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
  });
  return res.status(200).json({ success: true, message: 'Logged out successfully.' });
};

/**
 * GET /auth/me
 * Returns the currently authenticated user (requires protect middleware).
 */
const getMe = (req, res) => {
  const { _id, name, email, role, organizationType, organizationName, identifier, usn, employeeId, createdAt } = req.user;
  return res.status(200).json({
    success: true,
    user: { _id, name, email, role, organizationType, organizationName, identifier: identifier || usn || employeeId, createdAt },
  });
};

/**
 * POST /auth/seed-admin
 * One-time admin creation via API (if no admin exists).
 */
const seedAdmin = async (req, res, next) => {
  try {
    const existingAdmin = await User.findOne({ role: 'admin' });

    if (existingAdmin) {
      return res.status(403).json({ success: false, message: 'An admin already exists. This endpoint is disabled.' });
    }

    const { name, email, password, employeeId } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'name, email, and password are required.' });
    }

    const hashedPassword = await bcrypt.hash(password.trim(), SALT_ROUNDS);

    const admin = await User.create({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      password: hashedPassword,
      role: 'admin',
      employeeId: employeeId ? employeeId.trim() : undefined,
    });

    return res.status(201).json({
      success: true,
      message: 'Admin created successfully.',
      admin: { id: admin._id, name: admin.name, email: admin.email, role: admin.role },
    });
  } catch (err) {
    if (err.code === 11000) {
      const field = Object.keys(err.keyValue)[0];
      return res.status(409).json({ success: false, message: `Duplicate value for field: ${field}` });
    }
    next(err);
  }
};

module.exports = { register, login, logout, getMe, seedAdmin };
