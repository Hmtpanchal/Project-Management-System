const ApiError = require('../utils/ApiError');

/**
 * Authorization guard for every /api/admin endpoint except the login route.
 */
function adminOnly(req, _res, next) {
  if (!req.user) {
    return next(new ApiError(401, 'Authentication required. Please sign in.'));
  }

  if (req.user.role !== 'admin') {
    return next(new ApiError(403, 'Administrator access is required.'));
  }

  return next();
}

module.exports = { adminOnly };
