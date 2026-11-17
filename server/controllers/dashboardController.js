const User = require('../models/User');
const Project = require('../models/Project');
const asyncHandler = require('../utils/asyncHandler');

function countsToObject(rows) {
  return rows.reduce((accumulator, row) => {
    accumulator[row._id] = row.count;
    return accumulator;
  }, {});
}

function withStatusDefaults(counts) {
  return {
    planning: counts.planning || 0,
    'in-progress': counts['in-progress'] || 0,
    completed: counts.completed || 0,
  };
}

/**
 * GET /api/dashboard
 * Statistics scoped to the signed-in user's own projects.
 */
const getUserDashboard = asyncHandler(async (req, res) => {
  const owner = req.user._id;

  const [
    totalProjects,
    inProgressProjects,
    completedProjects,
    highPriorityProjects,
    statusRows,
    recentProjects,
  ] = await Promise.all([
    Project.countDocuments({ owner }),
    Project.countDocuments({ owner, status: 'in-progress' }),
    Project.countDocuments({ owner, status: 'completed' }),
    Project.countDocuments({ owner, priority: 'high', status: { $ne: 'completed' } }),
    Project.aggregate([
      { $match: { owner } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]),
    Project.find({ owner }).sort({ updatedAt: -1 }).limit(5),
  ]);

  res.json({
    success: true,
    data: {
      stats: {
        totalProjects,
        inProgressProjects,
        completedProjects,
        highPriorityProjects,
      },
      statusCounts: withStatusDefaults(countsToObject(statusRows)),
      recentProjects,
    },
  });
});

/**
 * GET /api/admin/dashboard
 * Organization-wide statistics, users, and recent activity.
 */
const getAdminDashboard = asyncHandler(async (_req, res) => {
  const [
    totalUsers,
    activeUsers,
    inactiveUsers,
    totalProjects,
    completedProjects,
    roleRows,
    statusRows,
    recentUsers,
    recentProjects,
  ] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ status: 'active' }),
    User.countDocuments({ status: 'inactive' }),
    Project.countDocuments(),
    Project.countDocuments({ status: 'completed' }),
    User.aggregate([{ $group: { _id: '$role', count: { $sum: 1 } } }]),
    Project.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
    User.find().sort({ createdAt: -1 }).limit(5),
    Project.find()
      .populate('owner', 'name email')
      .sort({ updatedAt: -1 })
      .limit(5),
  ]);

  const roleCounts = countsToObject(roleRows);
  const statusCounts = withStatusDefaults(countsToObject(statusRows));

  res.json({
    success: true,
    data: {
      stats: {
        totalUsers,
        activeUsers,
        inactiveUsers,
        totalProjects,
        completedProjects,
      },
      roleCounts: {
        admin: roleCounts.admin || 0,
        user: roleCounts.user || 0,
      },
      statusCounts,
      recentUsers,
      recentProjects,
    },
  });
});

module.exports = { getUserDashboard, getAdminDashboard };
