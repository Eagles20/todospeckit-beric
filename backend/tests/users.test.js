/**
 * Feature 4 — User Profile Management
 * Spec: features/feature-4-user-profile-management.md
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

const profileApi = (token) => ({
  get: (id) => request(app).get(`/todo/users/${id}`).set("Authorization", `Bearer ${token}`),
  put: (id, body) =>
    request(app).put(`/todo/users/${id}`).set("Authorization", `Bearer ${token}`).send(body),
});

beforeEach(async () => {
  await syncTestDatabase();
});

afterAll(async () => {
  await db.sequelize.close();
});

describe("Feature 4 — Profile API", () => {
  describe("US-4.2 — Edit profile", () => {
    it("User fetches their own profile", async () => {
      const user = await registerUser("usera", "a@example.com");
      const res = await profileApi(user.token).get(user.userId);

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({
        id: user.userId,
        fName: "Test",
        lName: "User",
        email: "a@example.com",
        username: "usera",
        role: "worker",
      });
      expect(res.body.password).toBeUndefined();
    });

    it("User attempts to fetch another user's profile", async () => {
      const userA = await registerUser("usera", "a@example.com");
      const userB = await registerUser("userb", "b@example.com");

      const res = await profileApi(userA.token).get(userB.userId);

      expect(res.status).toBe(404);
      expect(res.body).toEqual({ message: `User with id=${userB.userId} not found.` });
    });

    it("User attempts to update another user's profile", async () => {
      const userA = await registerUser("usera", "a@example.com");
      const userB = await registerUser("userb", "b@example.com");

      const res = await profileApi(userA.token).put(userB.userId, {
        fName: "Hacked",
        lName: "User",
        email: "b@example.com",
        username: "userb",
      });

      expect(res.status).toBe(404);
      expect(res.body).toEqual({ message: `User with id=${userB.userId} not found.` });

      const stored = await db.user.findByPk(userB.userId);
      expect(stored.fName).toBe("Test");
    });

    it("Unauthenticated profile API request", async () => {
      const res = await request(app).get("/todo/users/1");

      expect(res.status).toBe(401);
      expect(res.body.message).toBe("Unauthorized! No token provided.");
    });

    it("Profile update rejects a password that is too short", async () => {
      const user = await registerUser("usera", "a@example.com");
      const res = await profileApi(user.token).put(user.userId, { password: "short" });

      expect(res.status).toBe(400);
      expect(res.body).toEqual({ message: "Password must be at least 8 characters." });
    });

    it("Profile update rejects missing required fields", async () => {
      const user = await registerUser("usera", "a@example.com");
      const res = await profileApi(user.token).put(user.userId, {
        lName: "User",
        email: "a@example.com",
        username: "usera",
      });

      expect(res.status).toBe(400);
      expect(res.body).toEqual({ message: "First name is required." });

      const stored = await db.user.findByPk(user.userId);
      expect(stored.fName).toBe("Test");
    });

    it("Profile update rejects a duplicate username", async () => {
      const userA = await registerUser("usera", "a@example.com");
      const userB = await registerUser("userb", "b@example.com");

      const res = await profileApi(userA.token).put(userA.userId, {
        fName: "Test",
        lName: "User",
        email: "a@example.com",
        username: "userb",
      });

      expect(res.status).toBe(400);
      expect(res.body).toEqual({ message: "Username is already taken." });

      const stored = await db.user.findByPk(userB.userId);
      expect(stored.username).toBe("userb");
    });

    it("Profile update rejects a duplicate email", async () => {
      const userA = await registerUser("usera", "a@example.com");
      const userB = await registerUser("userb", "b@example.com");

      const res = await profileApi(userA.token).put(userA.userId, {
        fName: "Test",
        lName: "User",
        email: "b@example.com",
        username: "usera",
      });

      expect(res.status).toBe(400);
      expect(res.body).toEqual({ message: "Email is already registered." });

      const stored = await db.user.findByPk(userB.userId);
      expect(stored.email).toBe("b@example.com");
    });

    it("Unauthenticated profile update API request", async () => {
      const res = await request(app).put("/todo/users/1").send({
        fName: "Jane",
        lName: "Doe",
        email: "jane@example.com",
        username: "jane",
      });

      expect(res.status).toBe(401);
      expect(res.body.message).toBe("Unauthorized! No token provided.");
    });

    it("User saves profile changes", async () => {
      const user = await registerUser("usera", "a@example.com");
      const before = await db.user.unscoped().findByPk(user.userId);

      const res = await profileApi(user.token).put(user.userId, {
        fName: "Jane",
        lName: "Doe",
        email: "jane@example.com",
        username: "JDoe",
      });

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({
        id: user.userId,
        fName: "Jane",
        lName: "Doe",
        email: "jane@example.com",
        username: "jdoe",
        role: "worker",
      });
      expect(res.body.password).toBeUndefined();

      const after = await db.user.unscoped().findByPk(user.userId);
      expect(after.password).toBe(before.password);
      expect(after.fName).toBe("Jane");
    });
  });
});
