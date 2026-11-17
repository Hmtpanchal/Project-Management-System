require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const mongoose = require('mongoose');
const { connectDB } = require('../config/db');
const User = require('../models/User');
const { validateEmail, validatePassword } = require('./validators');

async function seedAdmin() {
  const name = (process.env.ADMIN_NAME || 'Orbit Administrator').trim();
  const email = (process.env.ADMIN_EMAIL || '').trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD || '';

  if (!email || !password) {
    throw new Error(
      'Set ADMIN_EMAIL and ADMIN_PASSWORD in server/.env before running the admin seed.',
    );
  }

  const emailError = validateEmail(email);
  const passwordError = validatePassword(password);
  if (emailError || passwordError) {
    throw new Error(emailError || passwordError);
  }

  await connectDB();

  const existing = await User.findOne({ email });
  if (existing) {
    existing.name = name;
    existing.role = 'admin';
    existing.status = 'active';
    existing.password = password;
    await existing.save();
    console.log(`Administrator updated: ${email}`);
  } else {
    await User.create({
      name,
      email,
      password,
      role: 'admin',
      status: 'active',
    });
    console.log(`Administrator created: ${email}`);
  }

  await mongoose.disconnect();
}

seedAdmin().catch(async (error) => {
  console.error('Admin seed failed:', error.message);
  await mongoose.disconnect();
  process.exit(1);
});
