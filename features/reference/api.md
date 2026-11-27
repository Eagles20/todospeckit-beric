# API Reference

**Base path:** `/todo/`
**Status:** Integrated API through **Feature 2** (authentication and todo lists).
**Authority for new work:** feature specs in `features/` — update this file in the same PR when routes or payloads change.

**Auth:** Send `Authorization: Bearer <token>` on protected routes.
**Errors:** `{ "message": "Human-readable explanation." }`

## Feature provenance

| Area | Feature |
|------|---------|
| Register, login, logout | 1 |
| List CRUD (`GET/POST/PUT/DELETE /todo/lists`) | 2 |

---

## Authentication (Feature 1)

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| `POST` | `/todo/register` | No | Create account and return a session |
| `POST` | `/todo/login` | No | Sign in; reuse a non-expired session when one exists |
| `POST` | `/todo/logout` | Yes | Clear the current session token |

**Register body:**

```json
{
  "fName": "Jane",
  "lName": "Doe",
  "email": "jdoe@example.com",
  "username": "jdoe",
  "password": "password123"
}
```

**Login body:**

```json
{
  "username": "jdoe",
  "password": "password123"
}
```

**Register / login success** (`201` register, `200` login). Password hash is never included.

```json
{
  "userId": 1,
  "username": "jdoe",
  "email": "jdoe@example.com",
  "fName": "Jane",
  "lName": "Doe",
  "role": "worker",
  "token": "<jwt>"
}
```

**Logout success** (`200`):

```json
{ "message": "Signed out successfully." }
```

**Auth errors:**

| Situation | Status | Message |
|-----------|--------|---------|
| Missing or whitespace-only name, email, username, or password | `400` | `"First name is required."`, `"Last name is required."`, `"Email is required."`, `"Username is required."`, or `"Password is required."` |
| Password shorter than 8 characters | `400` | `"Password must be at least 8 characters."` |
| Duplicate username | `400` | `"Username is already taken."` |
| Duplicate email | `400` | `"Email is already registered."` |
| Wrong username or password | `401` | `"Invalid username or password."` |
| Missing Bearer token | `401` | `"Unauthorized! No token provided."` |
| Unknown or expired token | `401` | `"Unauthorized! Invalid or expired token."` |

Scaffold health check: `GET /todo/health` returns `{ "status": "ok" }`.

---

## Lists (Feature 2)

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| `GET` | `/todo/lists` | Yes | Lists owned by the caller, ordered by `name` A to Z |
| `POST` | `/todo/lists` | Yes | Create a list owned by the caller |
| `PUT` | `/todo/lists/:listId` | Yes | Rename a list the caller owns |
| `DELETE` | `/todo/lists/:listId` | Yes | Delete a list the caller owns |

**Create / rename body:**

```json
{ "name": "Groceries" }
```

A `userId` in the body is ignored. The saved owner is the signed-in user.

**List success** (`201` create, `200` rename):

```json
{
  "id": 1,
  "name": "Groceries",
  "userId": 42,
  "createdAt": "2026-07-02T12:00:00.000Z",
  "updatedAt": "2026-07-02T12:00:00.000Z"
}
```

**Delete success** (`200`):

```json
{ "message": "List deleted successfully." }
```

**List errors:**

| Situation | Status | Message |
|-----------|--------|---------|
| Missing or whitespace-only name | `400` | `"List name is required."` |
| Name longer than 100 characters | `400` | `"List name must be 100 characters or fewer."` |
| `listId` is not a number | `400` | `"Invalid list id."` |
| Missing list, or a list owned by someone else | `404` | `"List with id=<id> not found."` |
| Missing token | `401` | `"Unauthorized! No token provided."` |
