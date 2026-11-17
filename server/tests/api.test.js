const { before, after, test } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-that-is-long-enough-for-the-suite';
process.env.CLIENT_URL = 'http://localhost:5173';

const { connectDB, disconnectDB } = require('../config/db');
const User = require('../models/User');
const Project = require('../models/Project');

let mongo;
let app;
let userAgent;
let adminAgent;
let adminUser;
let normalUser;
let createdProjectId;
let managedUserId;

before(async () => {
  // Use an explicit test database when one is available (for example a local
  // mongod). Otherwise mongodb-memory-server downloads and starts a temporary
  // MongoDB binary on first run.
  let uri = process.env.TEST_MONGODB_URI;
  if (!uri) {
    mongo = await MongoMemoryServer.create();
    uri = mongo.getUri();
  }

  await connectDB(uri);
  await mongoose.connection.dropDatabase();
  app = require('../app');

  adminUser = await User.create({
    name: 'Test Administrator',
    email: 'admin@test.com',
    password: 'Admin@12345',
    role: 'admin',
    status: 'active',
  });

  userAgent = request.agent(app);
  adminAgent = request.agent(app);
});

after(async () => {
  await disconnectDB();
  if (mongo) await mongo.stop();
});

test('registers a user with validation, a secure cookie, and duplicate protection', async () => {
  const invalid = await userAgent.post('/api/auth/register').send({
    name: 'A',
    email: 'bad-email',
    password: 'short',
    confirmPassword: 'different',
  });

  assert.equal(invalid.status, 400);
  assert.ok(invalid.body.errors.name);
  assert.ok(invalid.body.errors.email);
  assert.ok(invalid.body.errors.password);
  assert.ok(invalid.body.errors.confirmPassword);

  const response = await userAgent.post('/api/auth/register').send({
    name: 'Normal User',
    email: 'user@test.com',
    password: 'User@12345',
    confirmPassword: 'User@12345',
  });

  assert.equal(response.status, 201);
  assert.equal(response.body.data.user.email, 'user@test.com');
  assert.equal(response.body.data.user.role, 'user');
  assert.equal(response.body.data.user.password, undefined);
  assert.match(response.headers['set-cookie'][0], /orbit_token=/);
  assert.match(response.headers['set-cookie'][0], /HttpOnly/);

  normalUser = response.body.data.user;

  const duplicate = await request(app).post('/api/auth/register').send({
    name: 'Another User',
    email: 'user@test.com',
    password: 'User@12345',
    confirmPassword: 'User@12345',
  });

  assert.equal(duplicate.status, 409);

  const me = await userAgent.get('/api/auth/me');
  assert.equal(me.status, 200);
  assert.equal(me.body.data.user.email, 'user@test.com');
});

test('rejects invalid credentials and keeps admin accounts in the admin portal', async () => {
  const wrongPassword = await request(app).post('/api/auth/login').send({
    email: 'user@test.com',
    password: 'Wrong@12345',
  });

  assert.equal(wrongPassword.status, 401);

  const adminOnUserPortal = await request(app).post('/api/auth/login').send({
    email: 'admin@test.com',
    password: 'Admin@12345',
  });

  assert.equal(adminOnUserPortal.status, 403);

  const userOnAdminPortal = await request(app).post('/api/auth/admin/login').send({
    email: 'user@test.com',
    password: 'User@12345',
  });

  assert.equal(userOnAdminPortal.status, 403);
});

test('creates, reads, updates, filters, and deletes projects', async () => {
  const invalid = await userAgent.post('/api/projects').send({ title: '' });
  assert.equal(invalid.status, 400);
  assert.ok(invalid.body.errors.title);

  const created = await userAgent.post('/api/projects').send({
    title: 'Launch readiness',
    description: 'Prepare the launch checklist.',
    status: 'planning',
    priority: 'high',
    dueDate: '2026-12-31',
  });

  assert.equal(created.status, 201);
  assert.equal(created.body.data.project.owner.email, 'user@test.com');
  createdProjectId = created.body.data.project._id;

  const list = await userAgent.get('/api/projects?search=Launch');
  assert.equal(list.status, 200);
  assert.equal(list.body.data.projects.length, 1);
  assert.equal(list.body.data.pagination.total, 1);

  const read = await userAgent.get(`/api/projects/${createdProjectId}`);
  assert.equal(read.status, 200);
  assert.equal(read.body.data.project.title, 'Launch readiness');

  const updated = await userAgent.put(`/api/projects/${createdProjectId}`).send({
    title: 'Launch readiness complete',
    status: 'completed',
    priority: 'medium',
  });

  assert.equal(updated.status, 200);
  assert.equal(updated.body.data.project.status, 'completed');

  const filtered = await userAgent.get('/api/projects?status=completed&priority=medium');
  assert.equal(filtered.status, 200);
  assert.equal(filtered.body.data.projects.length, 1);

  const otherUser = await User.create({
    name: 'Other User',
    email: 'other@test.com',
    password: 'Other@12345',
  });
  const privateProject = await Project.create({
    title: 'Private project',
    owner: otherUser._id,
  });

  const forbidden = await userAgent.get(`/api/projects/${privateProject._id}`);
  assert.equal(forbidden.status, 404);

  const dashboard = await userAgent.get('/api/dashboard');
  assert.equal(dashboard.status, 200);
  assert.equal(dashboard.body.data.stats.totalProjects, 1);
  assert.equal(dashboard.body.data.stats.completedProjects, 1);

  const deleted = await userAgent.delete(`/api/projects/${createdProjectId}`);
  assert.equal(deleted.status, 200);

  const missing = await userAgent.get(`/api/projects/${createdProjectId}`);
  assert.equal(missing.status, 404);
});

test('blocks unauthenticated and non-admin access to the admin API', async () => {
  const anonymous = await request(app).get('/api/admin/users');
  assert.equal(anonymous.status, 401);

  const forbidden = await userAgent.get('/api/admin/dashboard');
  assert.equal(forbidden.status, 403);

  const adminLogin = await adminAgent.post('/api/auth/admin/login').send({
    email: 'admin@test.com',
    password: 'Admin@12345',
  });

  assert.equal(adminLogin.status, 200);
  assert.equal(adminLogin.body.data.user.role, 'admin');
});

test('returns dynamic admin dashboard and paginated user management data', async () => {
  const dashboard = await adminAgent.get('/api/admin/dashboard');
  assert.equal(dashboard.status, 200);
  assert.ok(dashboard.body.data.stats.totalUsers >= 3);
  assert.ok(dashboard.body.data.stats.activeUsers >= 2);
  assert.equal(typeof dashboard.body.data.roleCounts.admin, 'number');
  assert.ok(Array.isArray(dashboard.body.data.recentUsers));

  const users = await adminAgent.get('/api/admin/users?limit=2&page=1');
  assert.equal(users.status, 200);
  assert.equal(users.body.data.users.length, 2);
  assert.ok(users.body.data.pagination.total >= 3);

  const search = await adminAgent.get('/api/admin/users?search=other@test.com');
  assert.equal(search.status, 200);
  assert.equal(search.body.data.users.length, 1);
  assert.equal(search.body.data.users[0].password, undefined);
});

test('allows administrators to add, view, edit, deactivate, and delete users', async () => {
  const invalid = await adminAgent.post('/api/admin/users').send({
    name: 'X',
    email: 'invalid',
    password: 'weak',
    role: 'owner',
  });

  assert.equal(invalid.status, 400);
  assert.ok(invalid.body.errors.role);

  const created = await adminAgent.post('/api/admin/users').send({
    name: 'Managed User',
    email: 'managed@test.com',
    password: 'Managed@12345',
    role: 'user',
    status: 'active',
  });

  assert.equal(created.status, 201);
  managedUserId = created.body.data.user._id;

  await Project.create({
    title: 'Managed project',
    owner: managedUserId,
  });

  const details = await adminAgent.get(`/api/admin/users/${managedUserId}`);
  assert.equal(details.status, 200);
  assert.equal(details.body.data.projectSummary.total, 1);
  assert.equal(details.body.data.recentProjects.length, 1);

  const updated = await adminAgent.put(`/api/admin/users/${managedUserId}`).send({
    name: 'Managed User Updated',
    email: 'managed@test.com',
    role: 'admin',
    status: 'inactive',
  });

  assert.equal(updated.status, 200);
  assert.equal(updated.body.data.user.role, 'admin');
  assert.equal(updated.body.data.user.status, 'inactive');

  const inactiveLogin = await request(app).post('/api/auth/admin/login').send({
    email: 'managed@test.com',
    password: 'Managed@12345',
  });
  assert.equal(inactiveLogin.status, 403);

  const selfDelete = await adminAgent.delete(`/api/admin/users/${adminUser._id}`);
  assert.equal(selfDelete.status, 400);

  const selfDemote = await adminAgent.put(`/api/admin/users/${adminUser._id}`).send({
    name: adminUser.name,
    email: adminUser.email,
    role: 'user',
    status: 'active',
  });
  assert.equal(selfDemote.status, 400);

  const deleted = await adminAgent.delete(`/api/admin/users/${managedUserId}`);
  assert.equal(deleted.status, 200);
  assert.equal(await Project.countDocuments({ owner: managedUserId }), 0);

  const missing = await adminAgent.get(`/api/admin/users/${managedUserId}`);
  assert.equal(missing.status, 404);
});

test('logs out by clearing the authentication cookie', async () => {
  const logout = await userAgent.post('/api/auth/logout');
  assert.equal(logout.status, 200);

  const me = await userAgent.get('/api/auth/me');
  assert.equal(me.status, 401);

  const protectedRoute = await userAgent.get('/api/projects');
  assert.equal(protectedRoute.status, 401);
});
