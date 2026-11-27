# Behavior & Rules Reference

**Living snapshot** of product rules currently in force. Feature 1 only.

These files answer: *"What rules does the app enforce right now?"*
They do **not** authorize new scope — implement only from `features/feature-*.md`.

| File | Role |
|------|------|
| [api.md](./api.md) | Routes / payloads |
| [data-model.md](./data-model.md) | Tables / columns |
| **This file** | Ownership, validation, session, and UI rules |

## Auth

| Rule | Enforcement | Introduced |
|------|-------------|------------|
| Sign-in uses **username + password**, not email | Login controller | Feature 1 |
| Username is trimmed and stored lowercase | User model setter; login/register normalize the same way | Feature 1 |
| Password minimum length is **8** characters | Register controller and Register form | Feature 1 |
| Passwords are hashed with bcrypt, **10** salt rounds, and never returned | Register controller; User `defaultScope` | Feature 1 |
| New users get role **`worker`** | User model default | Feature 1 |
| A session lasts **24 hours**. Login reuses a non-expired session for that user | Auth controller | Feature 1 |
| Logout clears the stored token to `""`. The same token then returns `401` | Logout controller + `authenticate` | Feature 1 |
| Wrong username and wrong password share one message: **"Invalid username or password."** | Login controller | Feature 1 |
| Duplicate username → **"Username is already taken."** Duplicate email → **"Email is already registered."** | Register controller | Feature 1 |
| Email on the register form is required and must match `/^[^\s@]+@[^\s@]+\.[^\s@]+$/`. Invalid format message: **"Enter a valid email address."** | `emailRules` in `frontend/src/config/validation.js` | Feature 1 |
| The browser session is `localStorage` key **`user`** (the flat login/register payload) | Login, Register, and `services.js` | Feature 1 |
| A signed-in user who opens the login page is sent to **home** | `router.beforeEach` | Feature 1 |
| A signed-out user who opens home is sent to **login** | `router.beforeEach` | Feature 1 |
| Authenticated API calls send `Authorization: Bearer <token>`. A `401` on a protected call clears `user` and goes to login | `services.js` interceptors | Feature 1 |
| Login and register pages, and the home placeholder, have **no MenuBar**. Home shows **"Welcome, {first name}!"** and a **Sign out** button | Login, Register, Home views | Feature 1 |
