const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const jwt = require('jsonwebtoken');
const { COOKIE_NAME } = require('../utils/generateToken');

/**
 * Authenticates a request from the HTTP-only JWT cookie (or a Bearer token for
 * API clients) and rejects inactive accounts.
 */
const protect = asyncHandler(async (req, _res, next) => {
  let token = req.cookies?.[COOKIE_NAME];

  if (!token && req.headers.authorization?.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    throw new ApiError(401, 'Authentication required. Please sign in.');
  }

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    throw new ApiError(401, 'Your session has expired. Please sign in again.');
  }

  const user = await User.findById(decoded.id);

  if (!user) {
    throw new ApiError(401, 'The account for this session no longer exists.');
  }

  if (user.status === 'inactive') {
    throw new ApiError(403, 'Your account has been deactivated. Contact an administrator.');
  }

  req.user = user;
  next();
});

module.exports = { protect };
