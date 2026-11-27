/**
 * Feature 2 — Todo List Management
 * Spec: features/feature-2-todo-list-management.md
 */

import request from "supertest";
import app from "../server.js";
import db from "../app/models/index.js";
import { syncTestDatabase } from "./helpers.js";

// Create a real user through the register API and return the session payload.
const registerUser = async (username, email) => {
  const res = await request(app).post("/todo/register").send({
    fName: "Test",
    lName: "User",
    email,
    username,
    password: "password123",
  });
  return res.body;
};

// Send an authenticated lists request.
const listsApi = (token) => ({
  get: () => request(app).get("/todo/lists").set("Authorization", `Bearer ${token}`),
  post: (body) =>
    request(app).post("/todo/lists").set("Authorization", `Bearer ${token}`).send(body),
  put: (id, body) =>
    request(app).put(`/todo/lists/${id}`).set("Authorization", `Bearer ${token}`).send(body),
  delete: (id) =>
    request(app).delete(`/todo/lists/${id}`).set("Authorization", `Bearer ${token}`),
});

beforeEach(async () => {
  await syncTestDatabase();
});

afterAll(async () => {
  await db.sequelize.close();
});

describe("Feature 2 — List API", () => {
  describe("US-2.1 — Create todo lists", () => {
    it("User creates a new list", async () => {
      const user = await registerUser("usera", "a@example.com");
      const api = listsApi(user.token);

      const res = await api.post({ name: "Groceries" });

      expect(res.status).toBe(201);
      expect(res.body).toMatchObject({
        name: "Groceries",
        userId: user.userId,
      });
      expect(res.body.id).toBeDefined();
      expect(res.body.createdAt).toBeDefined();
      expect(res.body.updatedAt).toBeDefined();

      const saved = await db.list.findByPk(res.body.id);
      expect(saved.userId).toBe(user.userId);
      expect(saved.name).toBe("Groceries");
    });

    it("User creates a list with an empty name", async () => {
      const user = await registerUser("usera", "a@example.com");
      const api = listsApi(user.token);

      const empty = await api.post({ name: "" });
      expect(empty.status).toBe(400);
      expect(empty.body.message).toBe("List name is required.");

      // Spaces alone are not a name either.
      const spaces = await api.post({ name: "   " });
      expect(spaces.status).toBe(400);
      expect(spaces.body.message).toBe("List name is required.");

      expect(await db.list.count()).toBe(0);
    });

    it("User creates a list with a name that is too long", async () => {
      const user = await registerUser("usera", "a@example.com");
      const res = await listsApi(user.token).post({ name: "a".repeat(101) });

      expect(res.status).toBe(400);
      expect(res.body.message).toBe("List name must be 100 characters or fewer.");
      expect(await db.list.count()).toBe(0);
    });
  });

  describe("US-2.2 — View my lists", () => {
    it("Dashboard loads with existing lists", async () => {
      const user = await registerUser("usera", "a@example.com");
      const api = listsApi(user.token);

      // Create out of alphabetical order. The API must return them A to Z.
      await api.post({ name: "Work" });
      await api.post({ name: "Personal" });

      const res = await api.get();

      expect(res.status).toBe(200);
      expect(res.body.map((list) => list.name)).toEqual(["Personal", "Work"]);
    });

    it("User cannot see another user's lists", async () => {
      const userA = await registerUser("usera", "a@example.com");
      const userB = await registerUser("userb", "b@example.com");

      await listsApi(userB.token).post({ name: "Secret Project" });
      await listsApi(userA.token).post({ name: "Groceries" });

      const res = await listsApi(userA.token).get();

      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(1);
      expect(res.body[0].name).toBe("Groceries");
      expect(res.body[0].userId).toBe(userA.userId);
      expect(res.body.map((list) => list.name)).not.toContain("Secret Project");
    });
  });

  describe("US-2.4 — Rename and delete lists", () => {
    it("User renames a list", async () => {
      const user = await registerUser("usera", "a@example.com");
      const api = listsApi(user.token);
      const created = await api.post({ name: "Groceries" });

      const res = await api.put(created.body.id, { name: "Shopping" });

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({
        id: created.body.id,
        name: "Shopping",
        userId: user.userId,
      });

      const saved = await db.list.findByPk(created.body.id);
      expect(saved.name).toBe("Shopping");
    });

    it("User deletes a list", async () => {
      const user = await registerUser("usera", "a@example.com");
      const api = listsApi(user.token);
      const created = await api.post({ name: "Groceries" });

      const res = await api.delete(created.body.id);

      expect(res.status).toBe(200);
      expect(res.body.message).toBe("List deleted successfully.");
      expect(await db.list.findByPk(created.body.id)).toBeNull();
    });
  });

  describe("US-2.5 — Private lists only", () => {
    it("User attempts to rename another user's list", async () => {
      const userA = await registerUser("usera", "a@example.com");
      const userB = await registerUser("userb", "b@example.com");
      const created = await listsApi(userB.token).post({ name: "Secret Project" });
      const listId = created.body.id;

      const res = await listsApi(userA.token).put(listId, { name: "Hijacked" });

      expect(res.status).toBe(404);
      expect(res.body.message).toBe(`List with id=${listId} not found.`);

      const saved = await db.list.findByPk(listId);
      expect(saved.name).toBe("Secret Project");
      expect(saved.userId).toBe(userB.userId);
    });

    it("User attempts to delete another user's list", async () => {
      const userA = await registerUser("usera", "a@example.com");
      const userB = await registerUser("userb", "b@example.com");
      const created = await listsApi(userB.token).post({ name: "Secret Project" });
      const listId = created.body.id;

      const res = await listsApi(userA.token).delete(listId);

      expect(res.status).toBe(404);
      expect(res.body.message).toBe(`List with id=${listId} not found.`);
      expect(await db.list.findByPk(listId)).not.toBeNull();
    });

    it("Client cannot assign a list to another user on create", async () => {
      const userA = await registerUser("usera", "a@example.com");

      const res = await listsApi(userA.token).post({
        name: "Groceries",
        userId: 999,
      });

      expect(res.status).toBe(201);
      expect(res.body.userId).toBe(userA.userId);
      expect(res.body.userId).not.toBe(999);

      const saved = await db.list.findByPk(res.body.id);
      expect(saved.userId).toBe(userA.userId);
    });

    it("Unauthenticated API request to lists", async () => {
      const res = await request(app).get("/todo/lists");

      expect(res.status).toBe(401);
      expect(res.body.message).toBe("Unauthorized! No token provided.");
    });
  });
});
