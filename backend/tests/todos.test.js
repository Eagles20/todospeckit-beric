/**
 * Feature 3 — Todo List Item Management
 * Spec: features/feature-3-todo-list-item-management.md
 */

import request from "supertest";
import app from "../server.js";
import db from "../app/models/index.js";
import { syncTestDatabase } from "./helpers.js";

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

const auth = (token) => (req) => req.set("Authorization", `Bearer ${token}`);

const createList = async (token, name) => {
  const res = await auth(token)(request(app).post("/todo/lists")).send({ name });
  return res.body;
};

beforeEach(async () => {
  await syncTestDatabase();
});

afterAll(async () => {
  await db.sequelize.close();
});

describe("Feature 3 — Todo API", () => {
  describe("US-3.1 — Add tasks to a list", () => {
    it("User adds a todo to a list via dialog", async () => {
      const user = await registerUser("usera", "a@example.com");
      const list = await createList(user.token, "Groceries");

      const res = await auth(user.token)(request(app).post(`/todo/lists/${list.id}/todos`)).send({
        title: "Buy milk",
      });

      expect(res.status).toBe(201);
      expect(res.body).toMatchObject({
        title: "Buy milk",
        completed: false,
        userId: user.userId,
        listId: list.id,
      });
    });

    it("User adds a todo with an empty title", async () => {
      const user = await registerUser("usera", "a@example.com");
      const list = await createList(user.token, "Groceries");

      const empty = await auth(user.token)(request(app).post(`/todo/lists/${list.id}/todos`)).send({
        title: "   ",
      });

      expect(empty.status).toBe(400);
      expect(empty.body.message).toBe("Todo title is required.");
      expect(await db.todo.count()).toBe(0);
    });
  });

  describe("US-3.2 — View tasks in a list", () => {
    it("User only sees their own todos when opening items", async () => {
      const userA = await registerUser("usera", "a@example.com");
      const userB = await registerUser("userb", "b@example.com");
      const listA = await createList(userA.token, "Work");
      const listB = await createList(userB.token, "Work");

      await auth(userA.token)(request(app).post(`/todo/lists/${listA.id}/todos`)).send({
        title: "My task",
      });
      await auth(userB.token)(request(app).post(`/todo/lists/${listB.id}/todos`)).send({
        title: "Their task",
      });

      const res = await auth(userA.token)(request(app).get(`/todo/lists/${listA.id}/todos`));

      expect(res.status).toBe(200);
      expect(res.body.map((todo) => todo.title)).toEqual(["My task"]);
    });
  });

  describe("US-3.3 — Complete tasks", () => {
    it("User marks a todo as complete", async () => {
      const user = await registerUser("usera", "a@example.com");
      const list = await createList(user.token, "Groceries");
      const created = await auth(user.token)(request(app).post(`/todo/lists/${list.id}/todos`)).send({
        title: "Buy milk",
      });

      const res = await auth(user.token)(request(app).put(`/todo/todos/${created.body.id}`)).send({
        completed: true,
      });

      expect(res.status).toBe(200);
      expect(res.body.completed).toBe(true);
      expect(res.body.title).toBe("Buy milk");
    });

    it("User marks a completed todo as incomplete", async () => {
      const user = await registerUser("usera", "a@example.com");
      const list = await createList(user.token, "Groceries");
      const created = await auth(user.token)(request(app).post(`/todo/lists/${list.id}/todos`)).send({
        title: "Buy milk",
      });
      await auth(user.token)(request(app).put(`/todo/todos/${created.body.id}`)).send({
        completed: true,
      });

      const res = await auth(user.token)(request(app).put(`/todo/todos/${created.body.id}`)).send({
        completed: false,
      });

      expect(res.status).toBe(200);
      expect(res.body.completed).toBe(false);
    });
  });

  describe("US-3.4 — Edit and remove tasks", () => {
    it("User edits a todo title", async () => {
      const user = await registerUser("usera", "a@example.com");
      const list = await createList(user.token, "Groceries");
      const created = await auth(user.token)(request(app).post(`/todo/lists/${list.id}/todos`)).send({
        title: "Buy milk",
      });

      const res = await auth(user.token)(request(app).put(`/todo/todos/${created.body.id}`)).send({
        title: "Buy oat milk",
      });

      expect(res.status).toBe(200);
      expect(res.body.title).toBe("Buy oat milk");
      expect(res.body.listId).toBe(list.id);
    });

    it("User deletes a todo", async () => {
      const user = await registerUser("usera", "a@example.com");
      const list = await createList(user.token, "Groceries");
      const created = await auth(user.token)(request(app).post(`/todo/lists/${list.id}/todos`)).send({
        title: "Buy milk",
      });

      const res = await auth(user.token)(request(app).delete(`/todo/todos/${created.body.id}`));

      expect(res.status).toBe(200);
      expect(res.body.message).toBe("Todo deleted successfully.");
      expect(await db.todo.findByPk(created.body.id)).toBeNull();
    });
  });

  describe("US-3.5 — Private items only", () => {
    it("User cannot read todos in another user's list", async () => {
      const userA = await registerUser("usera", "a@example.com");
      const userB = await registerUser("userb", "b@example.com");
      const secret = await createList(userB.token, "Secret");
      await auth(userB.token)(request(app).post(`/todo/lists/${secret.id}/todos`)).send({
        title: "Hidden task",
      });

      const res = await auth(userA.token)(request(app).get(`/todo/lists/${secret.id}/todos`));

      expect(res.status).toBe(404);
      expect(res.body.message).toBe(`List with id=${secret.id} not found.`);
      expect(res.body.title).toBeUndefined();
    });

    it("User attempts to add a todo to another user's list", async () => {
      const userA = await registerUser("usera", "a@example.com");
      const userB = await registerUser("userb", "b@example.com");
      const secret = await createList(userB.token, "Secret");

      const res = await auth(userA.token)(request(app).post(`/todo/lists/${secret.id}/todos`)).send({
        title: "Intruder task",
      });

      expect(res.status).toBe(404);
      expect(res.body.message).toBe(`List with id=${secret.id} not found.`);
      expect(await db.todo.count({ where: { listId: secret.id } })).toBe(0);
    });

    it("User attempts to rename another user's todo", async () => {
      const userA = await registerUser("usera", "a@example.com");
      const userB = await registerUser("userb", "b@example.com");
      const secret = await createList(userB.token, "Secret");
      const created = await auth(userB.token)(request(app).post(`/todo/lists/${secret.id}/todos`)).send({
        title: "Hidden task",
      });

      const res = await auth(userA.token)(request(app).put(`/todo/todos/${created.body.id}`)).send({
        title: "Hijacked",
      });

      expect(res.status).toBe(404);
      expect(res.body.message).toBe(`Todo with id=${created.body.id} not found.`);
      const saved = await db.todo.findByPk(created.body.id);
      expect(saved.title).toBe("Hidden task");
    });

    it("User attempts to delete another user's todo", async () => {
      const userA = await registerUser("usera", "a@example.com");
      const userB = await registerUser("userb", "b@example.com");
      const secret = await createList(userB.token, "Secret");
      const created = await auth(userB.token)(request(app).post(`/todo/lists/${secret.id}/todos`)).send({
        title: "Hidden task",
      });

      const res = await auth(userA.token)(request(app).delete(`/todo/todos/${created.body.id}`));

      expect(res.status).toBe(404);
      expect(res.body.message).toBe(`Todo with id=${created.body.id} not found.`);
      expect(await db.todo.findByPk(created.body.id)).not.toBeNull();
    });

    it("Client cannot assign a todo to another user on create", async () => {
      const userA = await registerUser("usera", "a@example.com");
      const list = await createList(userA.token, "Groceries");

      const res = await auth(userA.token)(request(app).post(`/todo/lists/${list.id}/todos`)).send({
        title: "Buy milk",
        userId: 999,
      });

      expect(res.status).toBe(201);
      expect(res.body.userId).toBe(userA.userId);
      const saved = await db.todo.findByPk(res.body.id);
      expect(saved.userId).toBe(userA.userId);
    });

    it("Unauthenticated API request for todos", async () => {
      const res = await request(app).get("/todo/lists/1/todos");

      expect(res.status).toBe(401);
      expect(res.body.message).toBe("Unauthorized! No token provided.");
    });
  });

  describe("US-3.6 — Lists carry their items", () => {
    it("Deleting a list removes its todos", async () => {
      const user = await registerUser("usera", "a@example.com");
      const list = await createList(user.token, "Groceries");
      await auth(user.token)(request(app).post(`/todo/lists/${list.id}/todos`)).send({ title: "Buy milk" });
      await auth(user.token)(request(app).post(`/todo/lists/${list.id}/todos`)).send({ title: "Buy eggs" });

      const deleted = await auth(user.token)(request(app).delete(`/todo/lists/${list.id}`));
      expect(deleted.status).toBe(200);

      expect(await db.todo.count({ where: { listId: list.id } })).toBe(0);
      const again = await auth(user.token)(request(app).get(`/todo/lists/${list.id}/todos`));
      expect(again.status).toBe(404);
    });
  });
});
