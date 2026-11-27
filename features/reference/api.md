# API Reference

**Base path:** `/todo/`
**Status:** Integrated API through **Feature 1** (register, login, logout).
**Authority for new work:** feature specs in `features/` — update this file in the same PR when routes or payloads change.

**Auth:** Send `Authorization: Bearer <token>` on protected routes.
**Errors:** `{ "message": "Human-readable explanation." }`

## Feature provenance

| Area | Feature |
|------|---------|
| Register, login, logout | 1 |

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

Scaffold health check (not part of Feature 1): `GET /todo/health` returns `{ "status": "ok" }`.
