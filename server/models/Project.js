const mongoose = require('mongoose');

const PROJECT_STATUSES = ['planning', 'in-progress', 'completed'];
const PROJECT_PRIORITIES = ['low', 'medium', 'high'];

const projectSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Project title is required.'],
      trim: true,
      minlength: [2, 'Project title must be at least 2 characters.'],
      maxlength: [120, 'Project title cannot exceed 120 characters.'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [1000, 'Description cannot exceed 1,000 characters.'],
      default: '',
    },
    status: {
      type: String,
      enum: {
        values: PROJECT_STATUSES,
        message: 'Invalid project status.',
      },
      default: 'planning',
    },
    priority: {
      type: String,
      enum: {
        values: PROJECT_PRIORITIES,
        message: 'Invalid project priority.',
      },
      default: 'medium',
    },
    dueDate: {
      type: Date,
      default: null,
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_doc, ret) => {
        delete ret.__v;
        return ret;
      },
    },
  },
);

projectSchema.index({ title: 'text', description: 'text' });
projectSchema.index({ status: 1, priority: 1 });
projectSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Project', projectSchema);
module.exports.PROJECT_STATUSES = PROJECT_STATUSES;
module.exports.PROJECT_PRIORITIES = PROJECT_PRIORITIES;
