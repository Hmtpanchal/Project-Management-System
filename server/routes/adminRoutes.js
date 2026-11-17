const express = require('express');
const {
  listUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
} = require('../controllers/adminController');
const { getAdminDashboard } = require('../controllers/dashboardController');
const { protect } = require('../middleware/authMiddleware');
const { adminOnly } = require('../middleware/adminMiddleware');

const router = express.Router();

// Every route below this line requires an authenticated administrator.
router.use(protect, adminOnly);

router.get('/dashboard', getAdminDashboard);

router.route('/users').get(listUsers).post(createUser);
router.route('/users/:id').get(getUserById).put(updateUser).delete(deleteUser);

module.exports = router;
