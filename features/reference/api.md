# API Reference

**Base path:** `/todo/`
**Status:** Integrated API through **Feature 5** (authentication, lists, todos, profile, and due dates).
**Authority for new work:** feature specs in `features/` — update this file in the same PR when routes or payloads change.

**Auth:** Send `Authorization: Bearer <token>` on protected routes.
**Errors:** `{ "message": "Human-readable explanation." }`

## Feature provenance

| Area | Feature |
|------|---------|
| Register, login, logout | 1 |
| List CRUD (`GET/POST/PUT/DELETE /todo/lists`) | 2 |
| Todo CRUD | 3 |
| Profile read and update (`GET/PUT /todo/users/:id`) | 4 |
| Optional todo `dueDate` | 5 |

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

---

## Todos (Feature 3)

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| `GET` | `/todo/lists/:listId/todos` | Yes | Todos in a list the caller owns. Incomplete first, then oldest `createdAt` |
| `POST` | `/todo/lists/:listId/todos` | Yes | Add a todo. `userId` is the caller. `completed` starts `false` |
| `PUT` | `/todo/todos/:id` | Yes | Change `title`, `completed`, and/or `dueDate` on a todo the caller owns |
| `DELETE` | `/todo/todos/:id` | Yes | Delete a todo the caller owns |

**Create body:**

```json
{ "title": "Buy milk", "dueDate": "2026-07-15" }
```

`dueDate` is optional. Omit it or send `null` for no due date.

A `userId` in the body is ignored.

**Update body** (send either field, or both):

```json
{ "title": "Buy oat milk", "completed": true, "dueDate": "2026-07-20" }
```

Send `dueDate: null` to clear the date. Leave `dueDate` out of the body to keep the saved date.

**Todo success** (`201` create, `200` update):

```json
{
  "id": 10,
  "listId": 1,
  "title": "Buy milk",
  "completed": false,
  "dueDate": "2026-07-15",
  "userId": 42,
  "createdAt": "2026-07-02T12:05:00.000Z",
  "updatedAt": "2026-07-02T12:05:00.000Z"
}
```

**Delete success** (`200`):

```json
{ "message": "Todo deleted successfully." }
```

**Todo errors:**

| Situation | Status | Message |
|-----------|--------|---------|
| Missing or whitespace-only title | `400` | `"Todo title is required."` |
| Title longer than 255 characters | `400` | `"Todo title must be 255 characters or fewer."` |
| `dueDate` is not a real `YYYY-MM-DD` calendar date | `400` | `"Due date must be a valid date in YYYY-MM-DD format."` |
| Parent list missing or owned by someone else | `404` | `"List with id=<id> not found."` |
| Todo missing or owned by someone else | `404` | `"Todo with id=<id> not found."` |
| Missing token | `401` | `"Unauthorized! No token provided."` |

---

## Profile (Feature 4)

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| `GET` | `/todo/users/:id` | Yes | The caller's own profile |
| `PUT` | `/todo/users/:id` | Yes | Update the caller's own profile |

A user can read and update only `id = req.user.id`. Another user's id returns `404`.

**Update body.** `password` is optional. Leave it out to keep the current password.

```json
{
  "fName": "Jane",
  "lName": "Doe",
  "email": "jane@example.com",
  "username": "jdoe",
  "password": "newpassword123"
}
```

**Profile success** (`200`). The password hash is never included. `users` has no timestamps.

```json
{
  "id": 42,
  "fName": "Jane",
  "lName": "Doe",
  "email": "jane@example.com",
  "username": "jdoe",
  "role": "worker"
}
```

`role` is returned and is not changed by this update. Username is stored lowercase.

**Profile errors:**

| Situation | Status | Message |
|-----------|--------|---------|
| Password present and shorter than 8 characters | `400` | `"Password must be at least 8 characters."` |
| Missing or whitespace-only first name, last name, email, or username | `400` | `"First name is required."`, `"Last name is required."`, `"Email is required."`, or `"Username is required."` |
| Username belongs to someone else | `400` | `"Username is already taken."` |
| Email belongs to someone else | `400` | `"Email is already registered."` |
| Missing user, or another user's id | `404` | `"User with id=<id> not found."` |
| Missing token | `401` | `"Unauthorized! No token provided."` |
