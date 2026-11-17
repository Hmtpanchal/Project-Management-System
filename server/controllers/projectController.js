const mongoose = require('mongoose');
const Project = require('../models/Project');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const {
  escapeRegex,
  parsePagination,
  buildPagination,
  isValidEnum,
} = require('../utils/validators');
const { PROJECT_STATUSES, PROJECT_PRIORITIES } = require('../models/Project');

function parseDueDate(value) {
  if (value === undefined) return { skip: true };
  if (value === null || value === '') return { value: null };
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return { error: 'Enter a valid due date.' };
  }
  return { value: date };
}

function validateProject(body, { partial = false } = {}) {
  const errors = {};

  if (!partial || body.title !== undefined) {
    if (typeof body.title !== 'string' || body.title.trim().length < 2) {
      errors.title = 'Project title must be at least 2 characters.';
    } else if (body.title.trim().length > 120) {
      errors.title = 'Project title cannot exceed 120 characters.';
    }
  }

  if (body.description !== undefined) {
    if (typeof body.description !== 'string') {
      errors.description = 'Description must be text.';
    } else if (body.description.length > 1000) {
      errors.description = 'Description cannot exceed 1,000 characters.';
    }
  }

  if (body.status !== undefined && !isValidEnum(body.status, PROJECT_STATUSES)) {
    errors.status = 'Select a valid project status.';
  }

  if (body.priority !== undefined && !isValidEnum(body.priority, PROJECT_PRIORITIES)) {
    errors.priority = 'Select a valid project priority.';
  }

  const dueDate = parseDueDate(body.dueDate);
  if (dueDate.error) errors.dueDate = dueDate.error;

  return { errors, dueDate };
}

function accessFilter(req) {
  return req.user.role === 'admin' ? {} : { owner: req.user._id };
}

async function findAccessibleProject(req) {
  if (!mongoose.isValidObjectId(req.params.id)) {
    throw new ApiError(400, 'Invalid project identifier.');
  }

  const project = await Project.findOne({
    _id: req.params.id,
    ...accessFilter(req),
  }).populate('owner', 'name email');

  if (!project) {
    throw new ApiError(404, 'Project not found.');
  }

  return project;
}

/**
 * GET /api/projects
 */
const listProjects = asyncHandler(async (req, res) => {
  const { page, limit, skip } = parsePagination(req.query);
  const { search = '', status, priority } = req.query;

  const filter = { ...accessFilter(req) };

  if (search.trim()) {
    const pattern = new RegExp(escapeRegex(search.trim()), 'i');
    filter.$or = [{ title: pattern }, { description: pattern }];
  }

  if (status && isValidEnum(status, PROJECT_STATUSES)) filter.status = status;
  if (priority && isValidEnum(priority, PROJECT_PRIORITIES)) filter.priority = priority;

  const [projects, total] = await Promise.all([
    Project.find(filter)
      .populate('owner', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Project.countDocuments(filter),
  ]);

  res.json({
    success: true,
    data: {
      projects,
      pagination: buildPagination(page, limit, total),
    },
  });
});

/**
 * GET /api/projects/:id
 */
const getProjectById = asyncHandler(async (req, res) => {
  const project = await findAccessibleProject(req);
  res.json({ success: true, data: { project } });
});

/**
 * POST /api/projects
 */
const createProject = asyncHandler(async (req, res) => {
  const { errors, dueDate } = validateProject(req.body);

  if (Object.keys(errors).length > 0) {
    throw new ApiError(400, 'Please correct the highlighted fields.', errors);
  }

  const project = await Project.create({
    title: req.body.title.trim(),
    description: (req.body.description || '').trim(),
    status: req.body.status || 'planning',
    priority: req.body.priority || 'medium',
    dueDate: dueDate.value ?? null,
    owner: req.user._id,
  });

  await project.populate('owner', 'name email');

  res.status(201).json({
    success: true,
    message: 'Project created successfully.',
    data: { project },
  });
});

/**
 * PUT /api/projects/:id
 */
const updateProject = asyncHandler(async (req, res) => {
  const project = await findAccessibleProject(req);
  const { errors, dueDate } = validateProject(req.body, { partial: true });

  if (Object.keys(errors).length > 0) {
    throw new ApiError(400, 'Please correct the highlighted fields.', errors);
  }

  if (req.body.title !== undefined) project.title = req.body.title.trim();
  if (req.body.description !== undefined) {
    project.description = req.body.description.trim();
  }
  if (req.body.status !== undefined) project.status = req.body.status;
  if (req.body.priority !== undefined) project.priority = req.body.priority;
  if (!dueDate.skip) project.dueDate = dueDate.value;

  await project.save();
  await project.populate('owner', 'name email');

  res.json({
    success: true,
    message: 'Project updated successfully.',
    data: { project },
  });
});

/**
 * DELETE /api/projects/:id
 */
const deleteProject = asyncHandler(async (req, res) => {
  const project = await findAccessibleProject(req);
  await project.deleteOne();

  res.json({
    success: true,
    message: 'Project deleted successfully.',
  });
});

module.exports = {
  listProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
};
