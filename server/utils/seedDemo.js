/**
 * Development-only demo data used to explore the UI and capture screenshots.
 * It never runs automatically. Do not run this against a production database.
 *
 *   npm run seed:demo --prefix server
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const mongoose = require('mongoose');
const { connectDB } = require('../config/db');
const User = require('../models/User');
const Project = require('../models/Project');

const DEMO_PASSWORD = 'User@12345';

const demoUsers = [
  { name: 'Maya Chen', email: 'maya@orbit.demo', role: 'user', status: 'active' },
  { name: 'Daniel Okafor', email: 'daniel@orbit.demo', role: 'user', status: 'active' },
  { name: 'Sofia Ramirez', email: 'sofia@orbit.demo', role: 'user', status: 'active' },
  { name: 'Liam Bennett', email: 'liam@orbit.demo', role: 'user', status: 'inactive' },
  { name: 'Aisha Patel', email: 'aisha@orbit.demo', role: 'user', status: 'active' },
  { name: 'Noah Kim', email: 'noah@orbit.demo', role: 'user', status: 'inactive' },
  { name: 'Elena Rossi', email: 'elena@orbit.demo', role: 'user', status: 'active' },
  { name: 'Thomas Ward', email: 'thomas@orbit.demo', role: 'admin', status: 'active' },
];

const demoProjects = [
  {
    ownerKey: 'maya',
    title: 'Customer portal redesign',
    description: 'Refresh the customer account experience with a responsive interface and clearer navigation.',
    status: 'in-progress',
    priority: 'high',
    dueDate: '2026-12-05',
  },
  {
    ownerKey: 'maya',
    title: 'Quarterly usability study',
    description: 'Run moderated sessions with ten customers and summarize the highest-impact findings.',
    status: 'planning',
    priority: 'medium',
    dueDate: '2026-12-18',
  },
  {
    ownerKey: 'maya',
    title: 'Accessibility audit',
    description: 'Review the core product flows against WCAG 2.1 AA requirements.',
    status: 'completed',
    priority: 'high',
    dueDate: '2026-10-22',
  },
  {
    ownerKey: 'daniel',
    title: 'Billing API migration',
    description: 'Move the legacy billing integration to the v2 payments API with zero downtime.',
    status: 'in-progress',
    priority: 'high',
    dueDate: '2026-11-28',
  },
  {
    ownerKey: 'daniel',
    title: 'Database backup verification',
    description: 'Validate restore procedures and document recovery time objectives.',
    status: 'completed',
    priority: 'medium',
    dueDate: '2026-09-30',
  },
  {
    ownerKey: 'sofia',
    title: 'Autumn campaign assets',
    description: 'Produce launch copy, lifecycle emails, and social assets for the autumn release.',
    status: 'planning',
    priority: 'medium',
    dueDate: '2026-12-02',
  },
  {
    ownerKey: 'sofia',
    title: 'Partner onboarding guide',
    description: 'Create a concise onboarding playbook for new integration partners.',
    status: 'in-progress',
    priority: 'low',
    dueDate: '2026-12-12',
  },
  {
    ownerKey: 'aisha',
    title: 'Support response playbook',
    description: 'Standardize response templates for common customer support scenarios.',
    status: 'completed',
    priority: 'medium',
    dueDate: '2026-10-14',
  },
  {
    ownerKey: 'aisha',
    title: 'Knowledge base cleanup',
    description: 'Archive outdated articles and improve search keywords across the help center.',
    status: 'planning',
    priority: 'low',
    dueDate: '2027-01-08',
  },
  {
    ownerKey: 'elena',
    title: 'Sales pipeline dashboard',
    description: 'Build a leadership dashboard covering conversion, velocity, and pipeline health.',
    status: 'in-progress',
    priority: 'high',
    dueDate: '2026-11-21',
  },
  {
    ownerKey: 'elena',
    title: 'Renewal risk review',
    description: 'Identify accounts with elevated renewal risk and agree on mitigation owners.',
    status: 'planning',
    priority: 'high',
    dueDate: '2026-12-09',
  },
  {
    ownerKey: 'thomas',
    title: 'Vendor security review',
    description: 'Complete the annual review of critical vendors and outstanding security findings.',
    status: 'in-progress',
    priority: 'medium',
    dueDate: '2026-12-15',
  },
  {
    ownerKey: 'liam',
    title: 'Mobile release checklist',
    description: 'Document release readiness checks for the mobile application.',
    status: 'completed',
    priority: 'low',
    dueDate: '2026-08-20',
  },
  {
    ownerKey: 'noah',
    title: 'Analytics event dictionary',
    description: 'Consolidate event definitions and ownership across product teams.',
    status: 'planning',
    priority: 'medium',
    dueDate: '2027-01-15',
  },
];

async function seedDemo() {
  await connectDB();

  const adminEmail = (process.env.ADMIN_EMAIL || 'admin@orbit.app').toLowerCase();
  const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@12345';

  let admin = await User.findOne({ email: adminEmail });
  if (!admin) {
    admin = await User.create({
      name: process.env.ADMIN_NAME || 'Orbit Administrator',
      email: adminEmail,
      password: adminPassword,
      role: 'admin',
      status: 'active',
    });
    console.log(`Created admin: ${adminEmail}`);
  }

  const demoEmails = demoUsers.map((user) => user.email);
  const existingDemoUsers = await User.find({ email: { $in: demoEmails } }).select('_id');
  if (existingDemoUsers.length > 0) {
    await Project.deleteMany({ owner: { $in: existingDemoUsers.map((user) => user._id) } });
    await User.deleteMany({ email: { $in: demoEmails } });
    console.log('Removed previous demo users and their projects.');
  }

  const createdUsers = await User.create(
    demoUsers.map((user) => ({ ...user, password: DEMO_PASSWORD })),
  );

  const usersByKey = {
    maya: createdUsers[0],
    daniel: createdUsers[1],
    sofia: createdUsers[2],
    liam: createdUsers[3],
    aisha: createdUsers[4],
    noah: createdUsers[5],
    elena: createdUsers[6],
    thomas: createdUsers[7],
  };

  const now = Date.now();
  const projects = demoProjects.map((project, index) => ({
    title: project.title,
    description: project.description,
    status: project.status,
    priority: project.priority,
    dueDate: new Date(project.dueDate),
    owner: usersByKey[project.ownerKey]._id,
    createdAt: new Date(now - index * 36 * 60 * 60 * 1000),
    updatedAt: new Date(now - index * 18 * 60 * 60 * 1000),
  }));

  await Project.insertMany(projects);

  console.log(`Created ${createdUsers.length} demo users and ${projects.length} projects.`);
  console.log(`Demo user password: ${DEMO_PASSWORD}`);
  console.log(`Admin: ${adminEmail} / ${adminPassword}`);

  await mongoose.disconnect();
}

seedDemo().catch(async (error) => {
  console.error('Demo seed failed:', error.message);
  await mongoose.disconnect();
  process.exit(1);
});
