const mongoose = require('mongoose');
const User = require('../models/User');
const Project = require('../models/Project');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const {
  validateName,
  validateEmail,
  validatePassword,
  isValidEnum,
  escapeRegex,
  parsePagination,
  buildPagination,
} = require('../utils/validators');

const ROLES = ['user', 'admin'];
const STATUSES = ['active', 'inactive'];

function serializeUser(user) {
  const object = user.toObject ? user.toObject() : { ...user };
  delete object.password;
  delete object.__v;
  return object;
}

function validateManagedUser(body, { passwordRequired }) {
  const errors = {};
  const nameError = validateName(body.name);
  const emailError = validateEmail(body.email);

  if (nameError) errors.name = nameError;
  if (emailError) errors.email = emailError;

  if (body.role !== undefined && !isValidEnum(body.role, ROLES)) {
    errors.role = 'Role must be either user or admin.';
  }

  if (body.status !== undefined && !isValidEnum(body.status, STATUSES)) {
    errors.status = 'Status must be either active or inactive.';
  }

  if (passwordRequired || body.password) {
    const passwordError = validatePassword(body.password);
    if (passwordError) errors.password = passwordError;
  }

  return errors;
}

/**
 * GET /api/admin/users
 */
const listUsers = asyncHandler(async (req, res) => {
  const { page, limit, skip } = parsePagination(req.query);
  const { search = '', role, status } = req.query;

  const filter = {};

  if (search.trim()) {
    const pattern = new RegExp(escapeRegex(search.trim()), 'i');
    filter.$or = [{ name: pattern }, { email: pattern }];
  }

  if (role && isValidEnum(role, ROLES)) filter.role = role;
  if (status && isValidEnum(status, STATUSES)) filter.status = status;

  const [users, total] = await Promise.all([
    User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    User.countDocuments(filter),
  ]);

  res.json({
    success: true,
    data: {
      users,
      pagination: buildPagination(page, limit, total),
    },
  });
});

/**
 * GET /api/admin/users/:id
 */
const getUserById = asyncHandler(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    throw new ApiError(400, 'Invalid user identifier.');
  }

  const user = await User.findById(req.params.id);
  if (!user) {
    throw new ApiError(404, 'User not found.');
  }

  const [projectCount, openProjects, completedProjects, recentProjects] = await Promise.all([
    Project.countDocuments({ owner: user._id }),
    Project.countDocuments({ owner: user._id, status: { $ne: 'completed' } }),
    Project.countDocuments({ owner: user._id, status: 'completed' }),
    Project.find({ owner: user._id })
      .sort({ updatedAt: -1 })
      .limit(5)
      .select('title status priority dueDate updatedAt'),
  ]);

  res.json({
    success: true,
    data: {
      user: serializeUser(user),
      projectSummary: {
        total: projectCount,
        open: openProjects,
        completed: completedProjects,
      },
      recentProjects,
    },
  });
});

/**
 * POST /api/admin/users
 */
const createUser = asyncHandler(async (req, res) => {
  const errors = validateManagedUser(req.body, { passwordRequired: true });

  if (Object.keys(errors).length > 0) {
    throw new ApiError(400, 'Please correct the highlighted fields.', errors);
  }

  const email = req.body.email.trim().toLowerCase();
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new ApiError(409, 'An account with this email address already exists.', {
      email: 'An account with this email address already exists.',
    });
  }

  const user = await User.create({
    name: req.body.name.trim(),
    email,
    password: req.body.password,
    role: req.body.role || 'user',
    status: req.body.status || 'active',
  });

  res.status(201).json({
    success: true,
    message: 'User created successfully.',
    data: { user: serializeUser(user) },
  });
});

/**
 * PUT /api/admin/users/:id
 */
const updateUser = asyncHandler(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    throw new ApiError(400, 'Invalid user identifier.');
  }

  const user = await User.findById(req.params.id).select('+password');
  if (!user) {
    throw new ApiError(404, 'User not found.');
  }

  const errors = validateManagedUser(req.body, { passwordRequired: false });
  if (Object.keys(errors).length > 0) {
    throw new ApiError(400, 'Please correct the highlighted fields.', errors);
  }

  const isSelf = user._id.equals(req.user._id);

  if (isSelf && req.body.role !== undefined && req.body.role !== 'admin') {
    throw new ApiError(400, 'You cannot remove your own administrator role.');
  }

  if (isSelf && req.body.status !== undefined && req.body.status !== 'active') {
    throw new ApiError(400, 'You cannot deactivate your own account.');
  }

  user.name = req.body.name.trim();
  user.email = req.body.email.trim().toLowerCase();

  if (req.body.role !== undefined) user.role = req.body.role;
  if (req.body.status !== undefined) user.status = req.body.status;
  if (req.body.password) user.password = req.body.password;

  await user.save();

  const updatedUser = await User.findById(user._id);

  res.json({
    success: true,
    message: 'User updated successfully.',
    data: { user: serializeUser(updatedUser) },
  });
});

/**
 * DELETE /api/admin/users/:id
 */
const deleteUser = asyncHandler(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    throw new ApiError(400, 'Invalid user identifier.');
  }

  if (req.params.id === req.user._id.toString()) {
    throw new ApiError(400, 'You cannot delete your own account.');
  }

  const user = await User.findById(req.params.id);
  if (!user) {
    throw new ApiError(404, 'User not found.');
  }

  const deletedProjects = await Project.deleteMany({ owner: user._id });
  await user.deleteOne();

  res.json({
    success: true,
    message: `User deleted successfully. ${deletedProjects.deletedCount} associated project(s) were also removed.`,
  });
});

module.exports = {
  listUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
};
