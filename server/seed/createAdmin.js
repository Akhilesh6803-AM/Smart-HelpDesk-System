/**
 * seed/createAdmin.js
 * Run with: node server/seed/createAdmin.js
 *
 * Creates a default admin account if none exists in the database.
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const mongoose = require('mongoose');
const bcrypt   = require('bcrypt');
const User     = require('../models/User');

// ── Default admin credentials ────────────────────────────────────────────────
const DEFAULT_ADMIN = {
  name:       'Super Admin',
  email:      'admin@helpdesk.edu',
  password:   'Admin@1234',        // Change after first login!
  employeeId: 'EMP-ADMIN-001',
  role:       'admin',
};

const SALT_ROUNDS = 12;

// ── Main ─────────────────────────────────────────────────────────────────────
(async () => {
  try {
    if (!process.env.MONGODB_URI) {
      console.error('❌  MONGODB_URI is not defined in .env');
      process.exit(1);
    }

    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅  Connected to MongoDB');

    // Check if admin already exists
    const existing = await User.findOne({ role: 'admin' });

    if (existing) {
      console.log('ℹ️   An admin account already exists.');
      console.log(`    Email: ${existing.email}`);
      console.log('    No changes made. Exiting.');
      process.exit(0);
    }

    // Create admin
    const hashedPassword = await bcrypt.hash(DEFAULT_ADMIN.password, SALT_ROUNDS);

    await User.create({
      name:       DEFAULT_ADMIN.name,
      email:      DEFAULT_ADMIN.email,
      password:   hashedPassword,
      role:       DEFAULT_ADMIN.role,
      employeeId: DEFAULT_ADMIN.employeeId,
    });

    console.log('\n🎉  Admin account created successfully!\n');
    console.log('┌─────────────────────────────────────────────┐');
    console.log('│              DEFAULT ADMIN CREDENTIALS       │');
    console.log('├─────────────────────────────────────────────┤');
    console.log(`│  Name       : ${DEFAULT_ADMIN.name.padEnd(30)}│`);
    console.log(`│  Email      : ${DEFAULT_ADMIN.email.padEnd(30)}│`);
    console.log(`│  Password   : ${DEFAULT_ADMIN.password.padEnd(30)}│`);
    console.log(`│  EmployeeID : ${DEFAULT_ADMIN.employeeId.padEnd(30)}│`);
    console.log('├─────────────────────────────────────────────┤');
    console.log('│  ⚠️  CHANGE THE PASSWORD AFTER FIRST LOGIN!  │');
    console.log('└─────────────────────────────────────────────┘\n');

    process.exit(0);
  } catch (err) {
    console.error('❌  Error creating admin:', err.message);
    process.exit(1);
  }
})();
