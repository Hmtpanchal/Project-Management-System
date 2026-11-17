# Orbit API reference

Base URL in development: `http://localhost:5000/api`

The Vite development server proxies `/api` from `http://localhost:5173` to Express, so browser requests are same-origin.

## Conventions

### Content type

All request bodies are JSON:

```http
Content-Type: application/json
```

### Success responses

```json
{
  "success": true,
  "message": "Optional human-readable message.",
  "data": {}
}
```

`data` is omitted for endpoints that do not return a resource. `message` is omitted for read-only responses that do not need one.

### Error responses

```json
{
  "success": false,
  "message": "Please correct the highlighted fields.",
  "errors": {
    "email": "Enter a valid email address."
  }
}
```

- `message` is always present.
- `errors` is present only when field-level messages are available.
- The front end displays `message` in an alert and maps `errors` to individual fields.

### Authentication

Successful registration or login sets this HTTP-only cookie:

```http
Set-Cookie: orbit_token=<jwt>; HttpOnly; Path=/; SameSite=Lax; Max-Age=604800
```

In production the cookie also has `Secure`.

Requests may alternatively send:

```http
Authorization: Bearer <jwt>
```

Every protected request loads the current user from MongoDB. Deleted or deactivated accounts are rejected even if their token has not expired.

### Pagination

List endpoints accept `page` and `limit` query parameters.

- `page` defaults to `1`.
- `limit` defaults to `8` and is clamped to `1–100`.
- Invalid values fall back to the defaults.

Pagination object:

```json
{
  "page": 1,
  "limit": 8,
  "total": 14,
  "pages": 2,
  "hasNextPage": true,
  "hasPreviousPage": false
}
```

`pages` is at least `1`, including when there are no records.

### Status codes

| Code | Meaning |
| --- | --- |
| `200` | Request succeeded |
| `201` | Resource created |
| `400` | Validation failed, invalid identifier, or a protected self-action |
| `401` | Missing, invalid, or expired authentication |
| `403` | Authenticated but not allowed (wrong role, inactive account, wrong portal) |
| `404` | Resource or route not found; also used when a project is not owned by the requester |
| `409` | Unique constraint conflict, currently a duplicate email |
| `429` | Rate limit exceeded |
| `500` | Unexpected server error |

### Rate limits

| Scope | Limit |
| --- | --- |
| `POST /auth/login` | 25 requests per 15 minutes per IP |
| `POST /auth/admin/login` | 25 requests per 15 minutes per IP |
| `POST /auth/register` | 15 requests per hour per IP |

Rate-limited responses:

```json
{
  "success": false,
  "message": "Too many attempts. Please wait a few minutes and try again."
}
```

Standard `RateLimit-*` headers are returned.

### Field validation

| Field | Rules |
| --- | --- |
| `name` | 2–60 characters after trimming |
| `email` | Valid email format, maximum 120 characters, stored lowercase |
| `password` | 8–72 characters, at least one letter and one number |
| `confirmPassword` | Must equal `password` |
| `title` | 2–120 characters after trimming |
| `description` | Maximum 1,000 characters |
| project `status` | `planning`, `in-progress`, or `completed` |
| project `priority` | `low`, `medium`, or `high` |
| user `role` | `user` or `admin` |
| user `status` | `active` or `inactive` |
| `dueDate` | Any date parseable by JavaScript `Date`, or `null` / `""` to clear |

---

## Health

### `GET /health`

Public. Confirms that the HTTP server is running. It does not check the database connection.

**Response `200`**

```json
{
  "success": true,
  "message": "Orbit API is running.",
  "timestamp": "2026-11-16T15:04:29.230Z"
}
```

---

## Authentication

### `POST /auth/register`

Public. Creates a normal user account, signs it in immediately, and sets the authentication cookie.

**Request**

```json
{
  "name": "Jordan Lee",
  "email": "jordan@example.com",
  "password": "Orbit@12345",
  "confirmPassword": "Orbit@12345"
}
```

**Response `201`**

```json
{
  "success": true,
  "message": "Your account has been created.",
  "data": {
    "user": {
      "_id": "6739f2a1c8e4a03f5e6d1234",
      "name": "Jordan Lee",
      "email": "jordan@example.com",
      "role": "user",
      "status": "active",
      "lastLoginAt": "2026-11-16T15:10:00.000Z",
      "createdAt": "2026-11-16T15:10:00.000Z",
      "updatedAt": "2026-11-16T15:10:00.000Z"
    }
  }
}
```

**Errors**

- `400` — invalid name, email, password, or confirmation; field errors are returned.
- `409` — an account with the email already exists (including accounts that differ only by case).

Registration always creates `role: "user"` and `status: "active"`; these fields cannot be supplied by the public endpoint.

---

### `POST /auth/login`

Public. Signs in a **normal user**.

**Request**

```json
{
  "email": "maya@orbit.demo",
  "password": "User@12345"
}
```

**Response `200`**

```json
{
  "success": true,
  "message": "Signed in successfully.",
  "data": {
    "user": {
      "_id": "6739f2a1c8e4a03f5e6d1234",
      "name": "Maya Chen",
      "email": "maya@orbit.demo",
      "role": "user",
      "status": "active",
      "lastLoginAt": "2026-11-16T15:15:00.000Z",
      "createdAt": "2026-11-15T09:00:00.000Z",
      "updatedAt": "2026-11-16T15:15:00.000Z"
    }
  }
}
```

**Errors**

- `400` — email or password is missing.
- `401` — email does not exist or the password is wrong. The same generic message is used for both.
- `403` — the account is an administrator (`Administrator accounts must sign in through the admin portal.`).
- `403` — the account is inactive (`This account is inactive. Please contact an administrator.`).
- `429` — rate limit exceeded.

The response sets `lastLoginAt` to the current time.

---

### `POST /auth/admin/login`

Public. Signs in an **administrator** through the admin portal.

**Request**

```json
{
  "email": "admin@orbit.app",
  "password": "Admin@12345"
}
```

**Response `200`**

```json
{
  "success": true,
  "message": "Administrator signed in successfully.",
  "data": {
    "user": {
      "_id": "6739f2a1c8e4a03f5e6d0001",
      "name": "Orbit Administrator",
      "email": "admin@orbit.app",
      "role": "admin",
      "status": "active",
      "lastLoginAt": "2026-11-16T15:20:00.000Z",
      "createdAt": "2026-11-15T08:00:00.000Z",
      "updatedAt": "2026-11-16T15:20:00.000Z"
    }
  }
}
```

**Errors**

- `400` — email or password is missing.
- `401` — invalid credentials.
- `403` — the account exists but is not an administrator (`This account does not have administrator access.`).
- `403` — inactive account.
- `429` — rate limit exceeded.

---

### `GET /auth/me`

Authenticated. Returns the current user. Used on application startup to restore the session.

**Response `200`**

```json
{
  "success": true,
  "data": {
    "user": {
      "_id": "6739f2a1c8e4a03f5e6d1234",
      "name": "Maya Chen",
      "email": "maya@orbit.demo",
      "role": "user",
      "status": "active",
      "lastLoginAt": "2026-11-16T15:15:00.000Z",
      "createdAt": "2026-11-15T09:00:00.000Z",
      "updatedAt": "2026-11-16T15:15:00.000Z"
    }
  }
}
```

**Errors**

- `401` — no cookie/token, invalid token, expired token, or deleted user.
- `403` — account deactivated after the token was issued.

A signed-out client intentionally receives `401`; the front end treats that as “no active session.”

---

### `POST /auth/logout`

Public. Clears the authentication cookie.

**Response `200`**

```json
{
  "success": true,
  "message": "You have been signed out."
}
```

No server-side session store is used, so logout is complete when the browser drops the cookie.

---

## User dashboard

### `GET /dashboard`

Authenticated. Returns statistics for the **signed-in user's own projects**.

**Response `200`**

```json
{
  "success": true,
  "data": {
    "stats": {
      "totalProjects": 3,
      "inProgressProjects": 1,
      "completedProjects": 1,
      "highPriorityProjects": 1
    },
    "statusCounts": {
      "planning": 1,
      "in-progress": 1,
      "completed": 1
    },
    "recentProjects": []
  }
}
```

- `highPriorityProjects` counts high-priority projects that are **not completed**.
- `recentProjects` returns up to five projects ordered by most recent update.
- Every status key is present, even when its count is zero.
- `recentProjects` items contain the standard project fields.

**Errors**

- `401` — unauthenticated.
- `403` — inactive account.

---

## Projects

Project access rules:

- Normal users can list, read, update, and delete only projects they own.
- Administrators can access every project.
- A project owned by someone else returns `404` rather than `403` to avoid revealing its existence.
- New projects are always owned by the authenticated requester, including administrators.

### Project object

```json
{
  "_id": "6739f5b2c8e4a03f5e6d5678",
  "title": "Customer portal redesign",
  "description": "Refresh the customer account experience.",
  "status": "in-progress",
  "priority": "high",
  "dueDate": "2026-12-05T00:00:00.000Z",
  "owner": {
    "_id": "6739f2a1c8e4a03f5e6d1234",
    "name": "Maya Chen",
    "email": "maya@orbit.demo"
  },
  "createdAt": "2026-11-16T08:34:00.000Z",
  "updatedAt": "2026-11-16T08:34:00.000Z"
}
```

`dueDate` is `null` when no date is set. `owner` is always populated with name and email in project responses.

---

### `GET /projects`

Authenticated. Returns a paginated, filterable list of accessible projects.

**Query parameters**

| Parameter | Description |
| --- | --- |
| `page` | Page number, default `1` |
| `limit` | Page size, default `8`, maximum `100` |
| `search` | Case-insensitive match against title or description |
| `status` | `planning`, `in-progress`, or `completed` |
| `priority` | `low`, `medium`, or `high` |

Invalid filter values are ignored. Search input is regex-escaped.

**Example**

```http
GET /api/projects?page=1&limit=8&search=portal&status=in-progress&priority=high
```

**Response `200`**

```json
{
  "success": true,
  "data": {
    "projects": [],
    "pagination": {
      "page": 1,
      "limit": 8,
      "total": 0,
      "pages": 1,
      "hasNextPage": false,
      "hasPreviousPage": false
    }
  }
}
```

Projects are ordered by creation date, newest first.

**Errors**

- `401` — unauthenticated.
- `403` — inactive account.

---

### `POST /projects`

Authenticated. Creates a project owned by the requester.

**Request**

```json
{
  "title": "Launch readiness",
  "description": "Prepare the launch checklist.",
  "status": "planning",
  "priority": "high",
  "dueDate": "2026-12-31"
}
```

- `title` is required.
- `description` defaults to an empty string.
- `status` defaults to `planning`.
- `priority` defaults to `medium`.
- `dueDate` is optional and defaults to `null`.

**Response `201`**

```json
{
  "success": true,
  "message": "Project created successfully.",
  "data": {
    "project": {
      "_id": "6739f5b2c8e4a03f5e6d5678",
      "title": "Launch readiness",
      "description": "Prepare the launch checklist.",
      "status": "planning",
      "priority": "high",
      "dueDate": "2026-12-31T00:00:00.000Z",
      "owner": {
        "_id": "6739f2a1c8e4a03f5e6d1234",
        "name": "Maya Chen",
        "email": "maya@orbit.demo"
      },
      "createdAt": "2026-11-16T16:00:00.000Z",
      "updatedAt": "2026-11-16T16:00:00.000Z"
    }
  }
}
```

**Errors**

- `400` — invalid title, description, status, priority, or due date with field errors.
- `401` — unauthenticated.

---

### `GET /projects/:id`

Authenticated. Returns one project if it is owned by the requester or the requester is an administrator.

**Response `200`**

```json
{
  "success": true,
  "data": {
    "project": {
      "_id": "6739f5b2c8e4a03f5e6d5678",
      "title": "Launch readiness",
      "description": "Prepare the launch checklist.",
      "status": "planning",
      "priority": "high",
      "dueDate": "2026-12-31T00:00:00.000Z",
      "owner": {
        "_id": "6739f2a1c8e4a03f5e6d1234",
        "name": "Maya Chen",
        "email": "maya@orbit.demo"
      },
      "createdAt": "2026-11-16T16:00:00.000Z",
      "updatedAt": "2026-11-16T16:00:00.000Z"
    }
  }
}
```

**Errors**

- `400` — malformed MongoDB identifier.
- `401` — unauthenticated.
- `404` — project does not exist or is not accessible to the requester.

---

### `PUT /projects/:id`

Authenticated. Partially updates an accessible project. Every field is optional, but supplied fields are validated.

**Request**

```json
{
  "title": "Launch readiness complete",
  "status": "completed",
  "priority": "medium",
  "dueDate": null
}
```

- Omitted fields are unchanged.
- `dueDate: null` or `dueDate: ""` clears the due date.
- `description: ""` clears the description.
- Ownership cannot be changed through this endpoint.

**Response `200`**

```json
{
  "success": true,
  "message": "Project updated successfully.",
  "data": {
    "project": {}
  }
}
```

**Errors**

- `400` — invalid identifier or field validation failed.
- `401` — unauthenticated.
- `404` — project not found or not accessible.

---

### `DELETE /projects/:id`

Authenticated. Permanently deletes an accessible project.

**Response `200`**

```json
{
  "success": true,
  "message": "Project deleted successfully."
}
```

**Errors**

- `400` — malformed identifier.
- `401` — unauthenticated.
- `404` — project not found or not accessible.

---

## Admin dashboard

### `GET /admin/dashboard`

Admin only. Returns organization-wide statistics.

**Response `200`**

```json
{
  "success": true,
  "data": {
    "stats": {
      "totalUsers": 9,
      "activeUsers": 7,
      "inactiveUsers": 2,
      "totalProjects": 14,
      "completedProjects": 4
    },
    "roleCounts": {
      "admin": 2,
      "user": 7
    },
    "statusCounts": {
      "planning": 5,
      "in-progress": 5,
      "completed": 4
    },
    "recentUsers": [],
    "recentProjects": []
  }
}
```

- `recentUsers` returns up to five accounts, newest first. Password fields are never selected or returned.
- `recentProjects` returns up to five projects ordered by most recent update, with `owner` populated.
- All status and role keys are present even when zero.

**Errors**

- `401` — unauthenticated.
- `403` — authenticated non-admin or inactive account.

---

## Admin user management

All routes in this section require an administrator.

### User object

```json
{
  "_id": "6739f2a1c8e4a03f5e6d1234",
  "name": "Maya Chen",
  "email": "maya@orbit.demo",
  "role": "user",
  "status": "active",
  "lastLoginAt": "2026-11-16T08:35:00.000Z",
  "createdAt": "2026-11-15T09:00:00.000Z",
  "updatedAt": "2026-11-16T08:35:00.000Z"
}
```

The password hash is never included in any response.

---

### `GET /admin/users`

Returns a paginated list of users.

**Query parameters**

| Parameter | Description |
| --- | --- |
| `page` | Page number, default `1` |
| `limit` | Page size, default `8`, maximum `100` |
| `search` | Case-insensitive match against name or email |
| `role` | `user` or `admin` |
| `status` | `active` or `inactive` |

Invalid filter values are ignored. Results are ordered by creation date, newest first.

**Example**

```http
GET /api/admin/users?page=1&limit=8&role=user&status=active&search=maya
```

**Response `200`**

```json
{
  "success": true,
  "data": {
    "users": [],
    "pagination": {
      "page": 1,
      "limit": 8,
      "total": 0,
      "pages": 1,
      "hasNextPage": false,
      "hasPreviousPage": false
    }
  }
}
```

**Errors**

- `401` — unauthenticated.
- `403` — non-admin.

---

### `POST /admin/users`

Creates a user with an explicit role and status.

**Request**

```json
{
  "name": "Managed User",
  "email": "managed@example.com",
  "password": "Managed@12345",
  "role": "user",
  "status": "active"
}
```

- `name`, `email`, and `password` are required.
- `role` defaults to `user`.
- `status` defaults to `active`.
- The password is hashed before storage.

**Response `201`**

```json
{
  "success": true,
  "message": "User created successfully.",
  "data": {
    "user": {
      "_id": "6739f6a1c8e4a03f5e6d9999",
      "name": "Managed User",
      "email": "managed@example.com",
      "role": "user",
      "status": "active",
      "lastLoginAt": null,
      "createdAt": "2026-11-16T16:30:00.000Z",
      "updatedAt": "2026-11-16T16:30:00.000Z"
    }
  }
}
```

**Errors**

- `400` — validation failed.
- `409` — email already exists.

---

### `GET /admin/users/:id`

Returns one user plus project aggregates.

**Response `200`**

```json
{
  "success": true,
  "data": {
    "user": {
      "_id": "6739f2a1c8e4a03f5e6d1234",
      "name": "Maya Chen",
      "email": "maya@orbit.demo",
      "role": "user",
      "status": "active",
      "lastLoginAt": "2026-11-16T08:35:00.000Z",
      "createdAt": "2026-11-15T09:00:00.000Z",
      "updatedAt": "2026-11-16T08:35:00.000Z"
    },
    "projectSummary": {
      "total": 3,
      "open": 2,
      "completed": 1
    },
    "recentProjects": [
      {
        "_id": "6739f5b2c8e4a03f5e6d5678",
        "title": "Customer portal redesign",
        "status": "in-progress",
        "priority": "high",
        "dueDate": "2026-12-05T00:00:00.000Z",
        "updatedAt": "2026-11-16T08:34:00.000Z"
      }
    ]
  }
}
```

- `open` counts projects whose status is not `completed`.
- `recentProjects` returns up to five projects ordered by most recent update.

**Errors**

- `400` — malformed identifier.
- `404` — user not found.

---

### `PUT /admin/users/:id`

Updates a user. `name` and `email` are required; `role`, `status`, and `password` are optional.

**Request**

```json
{
  "name": "Maya Chen",
  "email": "maya@orbit.demo",
  "role": "admin",
  "status": "active",
  "password": "NewPassword@123"
}
```

- Include `password` only to reset it; omit it to keep the current password.
- An empty `password` is treated as “no change.”
- Changing the email to an existing account returns `409`.

**Self-protection rules**

An administrator cannot:

- change their own role away from `admin`;
- change their own status away from `active`;
- delete their own account.

**Response `200`**

```json
{
  "success": true,
  "message": "User updated successfully.",
  "data": {
    "user": {}
  }
}
```

**Errors**

- `400` — validation failed, malformed identifier, or self-protection rule violated.
- `404` — user not found.
- `409` — email belongs to another account.

---

### `DELETE /admin/users/:id`

Permanently deletes a user and all projects owned by that user.

**Response `200`**

```json
{
  "success": true,
  "message": "User deleted successfully. 3 associated project(s) were also removed."
}
```

**Errors**

- `400` — malformed identifier, or attempting to delete the signed-in administrator's own account.
- `404` — user not found.

---

## cURL walkthrough

```bash
# Register and save the authentication cookie
curl -i -c cookies.txt -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Jordan Lee","email":"jordan@example.com","password":"Orbit@12345","confirmPassword":"Orbit@12345"}'

# Check the session
curl -b cookies.txt http://localhost:5000/api/auth/me

# Create a project
curl -b cookies.txt -X POST http://localhost:5000/api/projects \
  -H "Content-Type: application/json" \
  -d '{"title":"Launch readiness","priority":"high","dueDate":"2026-12-31"}'

# List projects with filters
curl -b cookies.txt "http://localhost:5000/api/projects?status=planning&priority=high&page=1"

# Sign out
curl -b cookies.txt -X POST http://localhost:5000/api/auth/logout
```

Administrator flow:

```bash
curl -i -c admin-cookies.txt -X POST http://localhost:5000/api/auth/admin/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@orbit.app","password":"Admin@12345"}'

curl -b admin-cookies.txt http://localhost:5000/api/admin/dashboard
curl -b admin-cookies.txt "http://localhost:5000/api/admin/users?role=user&status=active"
```

## Route not found

Unmatched API routes return `404` with the requested method and path:

```json
{
  "success": false,
  "message": "Route not found: GET /api/unknown"
}
```
