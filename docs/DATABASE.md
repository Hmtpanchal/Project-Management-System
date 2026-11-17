# Orbit database structure

Orbit uses a single MongoDB database with two collections: `users` and `projects`. The schema is defined with Mongoose in `server/models/User.js` and `server/models/Project.js`.

## Connection

The connection string comes from `MONGODB_URI` in `server/.env`.

```dotenv
MONGODB_URI=mongodb://127.0.0.1:27017/orbit
```

MongoDB Atlas example:

```dotenv
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/orbit?retryWrites=true&w=majority
```

The server connects in `server/config/db.js` with a 10-second server-selection timeout. It fails fast with a clear error when the URI is missing or the database is unreachable.

## Entity relationship

```text
User 1 ──────── * Project
      owner (required)
```

- One user can own many projects.
- Every project has exactly one owner.
- A project cannot exist without a valid user reference.
- Deleting a user through the API deletes that user's projects first.

## `users` collection

| Field | Type | Required | Default | Notes |
| --- | --- | --- | --- | --- |
| `_id` | ObjectId | Yes | Generated | Primary key |
| `name` | String | Yes | — | Trimmed, 2–60 characters |
| `email` | String | Yes | — | Unique, trimmed, lowercase, valid format, maximum 120 characters |
| `password` | String | Yes | — | bcrypt hash, `select: false`, minimum 8 characters before hashing |
| `role` | String | Yes | `user` | Enum: `user`, `admin` |
| `status` | String | Yes | `active` | Enum: `active`, `inactive` |
| `lastLoginAt` | Date | No | `null` | Updated on successful login |
| `createdAt` | Date | Yes | Automatic | Mongoose timestamp |
| `updatedAt` | Date | Yes | Automatic | Mongoose timestamp |
| `__v` | Number | Yes | Automatic | Removed from JSON responses |

### Password handling

A pre-save hook hashes the password whenever the field is modified:

```js
userSchema.pre('save', async function hashPassword() {
  if (!this.isModified('password')) return;
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
});
```

`password` is `select: false`, so normal queries do not load it. Login explicitly uses `.select('+password')`. The `toJSON` transform also deletes the hash and `__v` as a defence in depth.

### Indexes

| Index | Purpose |
| --- | --- |
| `{ email: 1 }` unique | Prevents duplicate accounts and speeds login lookups |
| `{ role: 1, status: 1 }` | Speeds admin filtering and role counts |

### JSON shape

```json
{
  "_id": "6739f2a1c8e4a03f5e6d1234",
  "name": "Maya Chen",
  "email": "maya@orbit.demo",
  "role": "user",
  "status": "active",
  "lastLoginAt": "2026-11-16T08:35:00.000Z",
  "createdAt": "2026-11-15T09:00:00.000Z",
  "updatedAt": "2026-11-16T08:35:00.000Z",
  "__v": 0
}
```

`__v` is removed before the document is sent by the API.

## `projects` collection

| Field | Type | Required | Default | Notes |
| --- | --- | --- | --- | --- |
| `_id` | ObjectId | Yes | Generated | Primary key |
| `title` | String | Yes | — | Trimmed, 2–120 characters |
| `description` | String | No | `""` | Trimmed, maximum 1,000 characters |
| `status` | String | Yes | `planning` | Enum: `planning`, `in-progress`, `completed` |
| `priority` | String | Yes | `medium` | Enum: `low`, `medium`, `high` |
| `dueDate` | Date | No | `null` | Optional; can be cleared with `null` or `""` |
| `owner` | ObjectId | Yes | — | References `users._id`, indexed |
| `createdAt` | Date | Yes | Automatic | Mongoose timestamp |
| `updatedAt` | Date | Yes | Automatic | Mongoose timestamp |
| `__v` | Number | Yes | Automatic | Removed from JSON responses |

### Indexes

| Index | Purpose |
| --- | --- |
| `{ title: "text", description: "text" }` | Text search support |
| `{ status: 1, priority: 1 }` | Status and priority filtering |
| `{ createdAt: -1 }` | Newest-first lists |
| `{ owner: 1 }` | User-scoped lists and ownership checks |

The API also escapes user search input and uses case-insensitive regular expressions for the project and user list endpoints.

### JSON shape

```json
{
  "_id": "6739f5b2c8e4a03f5e6d5678",
  "title": "Customer portal redesign",
  "description": "Refresh the customer account experience with a responsive interface and clearer navigation.",
  "status": "in-progress",
  "priority": "high",
  "dueDate": "2026-12-05T00:00:00.000Z",
  "owner": {
    "_id": "6739f2a1c8e4a03f5e6d1234",
    "name": "Maya Chen",
    "email": "maya@orbit.demo"
  },
  "createdAt": "2026-11-16T08:34:00.000Z",
  "updatedAt": "2026-11-16T08:34:00.000Z",
  "__v": 0
}
```

Project API responses populate `owner` with `name` and `email`; the database stores only the owner's ObjectId.

## Access rules in queries

Project list and detail queries combine the requested resource with an access filter:

```js
// Normal user
{ owner: req.user._id }

// Administrator
{}
```

This means a normal user's list query never returns another user's projects, and a direct request for an inaccessible project returns `404`.

## Deletion behavior

`DELETE /api/admin/users/:id` performs:

```js
const deletedProjects = await Project.deleteMany({ owner: user._id });
await user.deleteOne();
```

Project documents are removed before the user document. The API reports how many projects were removed. Administrators cannot delete their own accounts, so at least one administrator cannot be removed accidentally through the UI or API.

## Status and priority values

Project status:

- `planning`
- `in-progress`
- `completed`

Project priority:

- `low`
- `medium`
- `high`

User role:

- `user`
- `admin`

User status:

- `active`
- `inactive`

These values are enforced by Mongoose enums and by the API validators.

## Seed data

### Administrator

```bash
npm run seed:admin --prefix server
```

Creates or updates the account configured by `ADMIN_NAME`, `ADMIN_EMAIL`, and `ADMIN_PASSWORD` in `server/.env`.

### Demo workspace

```bash
npm run seed:demo --prefix server
```

Creates:

- 8 demo users
- 14 demo projects
- the administrator account if it does not already exist

Demo users and their projects are removed and recreated on each run. The admin account is left in place.

The seed scripts are optional, development-only tools. The application itself contains no hardcoded users, projects, statistics, or dashboard values.

## Recommended local inspection

Using `mongosh`:

```javascript
use orbit

db.users.find({}, { password: 0 }).pretty()
db.projects.find().sort({ createdAt: -1 }).limit(5).pretty()

db.users.countDocuments()
db.projects.countDocuments()

db.users.getIndexes()
db.projects.getIndexes()
```

Using MongoDB Compass, connect with the same `MONGODB_URI` and inspect the `orbit` database.
