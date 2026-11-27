# Behavior & Rules Reference

**Living snapshot** of product rules currently in force through Feature 5.

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
| Login and register pages have **no MenuBar** | `App.vue` | Feature 1 |
| Home is the lists dashboard | `Dashboard.vue` | Feature 2 |
| **MenuBar** is a user icon (`mdi-account-circle`). The dropdown shows full name, username, and email, plus **Edit Profile** and **Log out**. There is no standalone **Sign out** button | `MenuBar.vue` | Feature 4 |
| Profile read and update apply only when `:id` is `req.user.id`. Anyone else gets **`404`** `"User with id=<id> not found."` | `getAccessibleUserOrNull` | Feature 4 |
| Profile update trims names, email, and username. Username is stored lowercase. A blank password is left unchanged. A password shorter than 8 characters is rejected | User controller | Feature 4 |
| Duplicate username or email on profile update uses the same messages as registration | User controller | Feature 4 |
| After a successful save, `localStorage` key `user` is refreshed (token kept) and `user-logged-in` is dispatched | `MenuBar.vue` | Feature 4 |
| Edit Profile uses the shared `emailRules`. Mismatched passwords show **"Passwords do not match."** | `MenuBar.vue` | Feature 4 |

## Lists

| Rule | Enforcement | Introduced |
|------|-------------|------------|
| A list belongs to one user and that owner never changes | Create sets `userId` from `req.user.id`; rename changes `name` only | Feature 2 |
| List reads, renames, and deletes include `userId: req.user.id`. Another user's list returns **`404`**, never `403` | `getAccessibleListOrNull` | Feature 2 |
| `GET /todo/lists` returns only the caller's lists, **A to Z by name** | List controller `order` | Feature 2 |
| List names are trimmed. Empty or whitespace-only names are rejected with **"List name is required."** Names over 100 characters are rejected with **"List name must be 100 characters or fewer."** | List controller and the dashboard form | Feature 2 |
| The dashboard heading is **My Lists**. Zero lists shows **"No lists yet. Create your first list."** | `Dashboard.vue` | Feature 2 |
| Each row has **Edit list** and **Delete list** icon actions. Add, rename, and delete use dialogs | `Dashboard.vue` | Feature 2 |
| Each list row also has **View items for {name}**. That opens a dialog of only that list's todos | `Dashboard.vue` | Feature 3 |
| **+ Add Item** is inside the items dialog, not on the main lists view | `Dashboard.vue` | Feature 3 |
| New todos start **not completed**. Titles are trimmed. Empty titles are **"Todo title is required."** Titles over 255 characters are rejected | Todo controller and the add/edit dialogs | Feature 3 |
| Todos are ordered **incomplete first**, then oldest `createdAt`. A completed title is struck through | Todo controller `order`; dashboard checkbox | Feature 3 |
| Another user's list or todo returns **`404`**, never `403`. Create ignores a client `userId` | `getAccessibleListOrNull`, `getAccessibleTodoOrNull` | Feature 3 |
| Deleting a list deletes its todos | `listId` foreign key `onDelete: CASCADE` | Feature 3 |
| A todo `dueDate` is an optional calendar date (`YYYY-MM-DD`) or `null`. Omit it on update to keep the saved date. Send `null` to clear it. An invalid date is **"Due date must be a valid date in YYYY-MM-DD format."** | Todo controller | Feature 5 |
| The items row shows a readable due date when one is set. An incomplete todo dated before today uses overdue styling. A completed todo does not | `Dashboard.vue` | Feature 5 |
