const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { setAuthCookie, clearAuthCookie } = require('../utils/generateToken');
const {
  validateName,
  validateEmail,
  validatePassword,
  validateConfirmPassword,
} = require('../utils/validators');

function publicUser(user) {
  const object = user.toObject ? user.toObject() : { ...user };
  delete object.password;
  delete object.__v;
  return object;
}

async function authenticateWithPassword(email, password) {
  const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';

  const user = await User.findOne({ email: normalizedEmail }).select('+password');

  if (!user) {
    throw new ApiError(401, 'Invalid email or password.');
  }

  const passwordMatches = await user.comparePassword(password || '');
  if (!passwordMatches) {
    throw new ApiError(401, 'Invalid email or password.');
  }

  if (user.status === 'inactive') {
    throw new ApiError(403, 'This account is inactive. Please contact an administrator.');
  }

  return user;
}

async function recordLogin(user) {
  user.lastLoginAt = new Date();
  await user.save({ validateBeforeSave: false });
}

const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password, confirmPassword } = req.body;
  const errors = {};

  const nameError = validateName(name);
  const emailError = validateEmail(email);
  const passwordError = validatePassword(password);
  const confirmError = validateConfirmPassword(password, confirmPassword);

  if (nameError) errors.name = nameError;
  if (emailError) errors.email = emailError;
  if (passwordError) errors.password = passwordError;
  if (confirmError) errors.confirmPassword = confirmError;

  if (Object.keys(errors).length > 0) {
    throw new ApiError(400, 'Please correct the highlighted fields.', errors);
  }

  const normalizedEmail = email.trim().toLowerCase();
  const existingUser = await User.findOne({ email: normalizedEmail });
  if (existingUser) {
    throw new ApiError(409, 'An account with this email address already exists.', {
      email: 'An account with this email address already exists.',
    });
  }

  const user = await User.create({
    name: name.trim(),
    email: normalizedEmail,
    password,
    role: 'user',
    status: 'active',
    lastLoginAt: new Date(),
  });

  setAuthCookie(res, user._id);

  res.status(201).json({
    success: true,
    message: 'Your account has been created.',
    data: { user: publicUser(user) },
  });
});

const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new ApiError(400, 'Email and password are required.', {
      ...(email ? {} : { email: 'Email is required.' }),
      ...(password ? {} : { password: 'Password is required.' }),
    });
  }

  const user = await authenticateWithPassword(email, password);

  if (user.role === 'admin') {
    throw new ApiError(403, 'Administrator accounts must sign in through the admin portal.');
  }

  await recordLogin(user);
  setAuthCookie(res, user._id);

  res.json({
    success: true,
    message: 'Signed in successfully.',
    data: { user: publicUser(user) },
  });
});

const adminLogin = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new ApiError(400, 'Email and password are required.', {
      ...(email ? {} : { email: 'Email is required.' }),
      ...(password ? {} : { password: 'Password is required.' }),
    });
  }

  const user = await authenticateWithPassword(email, password);

  if (user.role !== 'admin') {
    throw new ApiError(403, 'This account does not have administrator access.');
  }

  await recordLogin(user);
  setAuthCookie(res, user._id);

  res.json({
    success: true,
    message: 'Administrator signed in successfully.',
    data: { user: publicUser(user) },
  });
});

const getMe = asyncHandler(async (req, res) => {
  res.json({
    success: true,
    data: { user: publicUser(req.user) },
  });
});

const logoutUser = asyncHandler(async (_req, res) => {
  clearAuthCookie(res);
  res.json({ success: true, message: 'You have been signed out.' });
});

module.exports = {
  registerUser,
  loginUser,
  adminLogin,
  getMe,
  logoutUser,
};
