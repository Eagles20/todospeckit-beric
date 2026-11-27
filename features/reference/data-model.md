# Data Model Reference

**Status:** Integrated schema through **Feature 2** (`users`, `sessions`, `lists`).
**Authority for new work:** feature specs in `features/` — update this file in the same PR when schema changes.

## Feature provenance

| Table / column | Introduced |
|----------------|------------|
| `users`, `sessions` | Feature 1 |
| `lists` | Feature 2 |

---

## `users`

| Column | Type | Rules |
|--------|------|-------|
| `id` | INTEGER PK | Auto-increment |
| `fName` | STRING | Required |
| `lName` | STRING | Required |
| `email` | STRING | Required, unique |
| `username` | STRING(100) | Required, unique; trimmed and stored lowercase |
| `password` | STRING(255) | Required; bcrypt hash only (never returned by API) |
| `role` | STRING(20) | Required; default `worker` |

No `createdAt` / `updatedAt` columns.

**Sequelize:** `defaultScope` excludes `password`. Login uses `User.unscoped()` to read the hash.

---

## `sessions`

| Column | Type | Rules |
|--------|------|-------|
| `id` | INTEGER PK | Auto-increment |
| `token` | STRING | Required; JWT string; cleared to `""` on logout |
| `email` | STRING | Required |
| `expirationDate` | DATE | Required; 24 hours from creation |
| `userId` | INTEGER FK | Required → `users.id` |

No `createdAt` / `updatedAt` columns.

---

## `lists`

| Column | Type | Rules |
|--------|------|-------|
| `id` | INTEGER PK | Auto-increment |
| `name` | STRING(100) | Required; trimmed before save |
| `userId` | INTEGER FK | Required → `users.id`; set from the signed-in user on create |
| `createdAt` | DATE | Sequelize timestamp |
| `updatedAt` | DATE | Sequelize timestamp |

---

## Associations

* `User hasMany Session` (`foreignKey: userId`)
* `Session belongsTo User` (`foreignKey: userId`)
* `User hasMany List` (`foreignKey: userId`)
* `List belongsTo User` (`foreignKey: userId`)
