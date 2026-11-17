const rateLimit = require('express-rate-limit');

const rateLimitHandler = (_req, res) => {
  res.status(429).json({
    success: false,
    message: 'Too many attempts. Please wait a few minutes and try again.',
  });
};

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 25,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  handler: rateLimitHandler,
});

const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 15,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  handler: rateLimitHandler,
});

module.exports = { loginLimiter, registerLimiter };
