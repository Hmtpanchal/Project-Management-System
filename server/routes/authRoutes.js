const express = require('express');
const {
  registerUser,
  loginUser,
  adminLogin,
  getMe,
  logoutUser,
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
const { loginLimiter, registerLimiter } = require('../middleware/rateLimiters');

const router = express.Router();

router.post('/register', registerLimiter, registerUser);
router.post('/login', loginLimiter, loginUser);
router.get('/me', protect, getMe);
router.post('/logout', logoutUser);

// The admin portal uses a distinct login endpoint so role checks are explicit.
router.post('/admin/login', loginLimiter, adminLogin);

module.exports = router;
