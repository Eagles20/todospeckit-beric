import request from "supertest";
import bcrypt from "bcryptjs";
import app from "../server.js";
import db from "../app/models/index.js";
import { syncTestDatabase } from "./helpers.js";

// A valid new user. Many tests reuse it.
const newUser = {
  fName: "Jane",
  lName: "Doe",
  email: "jane@example.com",
  username: "jdoe",
  password: "password123",
};

// Helper: call the real register API and return the response.
const registerNewUser = () => request(app).post("/todo/register").send(newUser);

// Before every test: drop and recreate the tables, so each test starts empty.
beforeEach(async () => {
  await syncTestDatabase();
});

// After all tests in this file: close the database connection.
afterAll(async () => {
  await db.sequelize.close();
});

describe("Feature 1 — Auth API", () => {
  describe("US-1.1 — Registration", () => {
    it("User registers with valid information", async () => {
      const res = await registerNewUser();

      // The API answers 201 with the flat user payload from the spec.
      expect(res.status).toBe(201);
      expect(res.body).toMatchObject({
        username: "jdoe",
        email: "jane@example.com",
        fName: "Jane",
        lName: "Doe",
        role: "worker",
      });
      expect(res.body.userId).toBeDefined();
      expect(typeof res.body.token).toBe("string");
      // The hash must never be returned.
      expect(res.body.password).toBeUndefined();

      // The user is in the database with a bcrypt hash, not the plain password.
      const saved = await db.user.unscoped().findOne({ where: { username: "jdoe" } });
      expect(saved).not.toBeNull();
      expect(saved.password).not.toBe(newUser.password);
      expect(await bcrypt.compare(newUser.password, saved.password)).toBe(true);

      // A session row was created for the returned token.
      const session = await db.session.findOne({ where: { token: res.body.token } });
      expect(session).not.toBeNull();
      expect(session.userId).toBe(res.body.userId);
    });

    it("User submits registration with missing email", async () => {
      // Copy the user but leave the email out.
      const { email, ...withoutEmail } = newUser;
      const res = await request(app).post("/todo/register").send(withoutEmail);

      expect(res.status).toBe(400);
      expect(res.body.message).toBe("Email is required.");
      // Nothing was saved.
      expect(await db.user.count()).toBe(0);
    });

    it("User submits registration with password too short", async () => {
      const res = await request(app)
        .post("/todo/register")
        .send({ ...newUser, password: "short12" }); // 7 characters

      expect(res.status).toBe(400);
      expect(res.body.message).toBe("Password must be at least 8 characters.");
      expect(await db.user.count()).toBe(0);
    });

    it("User registers with a duplicate username", async () => {
      await registerNewUser();
      // Same username, different email.
      const res = await request(app)
        .post("/todo/register")
        .send({ ...newUser, email: "other@example.com" });

      expect(res.status).toBe(400);
      expect(res.body.message).toBe("Username is already taken.");
      expect(await db.user.count()).toBe(1);
    });

    it("User registers with a duplicate email", async () => {
      await registerNewUser();
      // Same email, different username.
      const res = await request(app)
        .post("/todo/register")
        .send({ ...newUser, username: "other" });

      expect(res.status).toBe(400);
      expect(res.body.message).toBe("Email is already registered.");
      expect(await db.user.count()).toBe(1);
    });
  });

  describe("US-1.2 — Sign in", () => {
    let registered;

    // For sign-in tests, a user must exist first.
    beforeEach(async () => {
      registered = (await registerNewUser()).body;
    });

    it("User signs in with valid credentials", async () => {
      const res = await request(app)
        .post("/todo/login")
        .send({ username: "jdoe", password: "password123" });

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({
        userId: registered.userId,
        username: "jdoe",
        role: "worker",
      });
      expect(typeof res.body.token).toBe("string");
      expect(res.body.password).toBeUndefined();

      // The live session from registration is reused (FR-006): one row, same token.
      expect(res.body.token).toBe(registered.token);
      expect(await db.session.count({ where: { userId: registered.userId } })).toBe(1);
    });

    it("User signs in with invalid password", async () => {
      const res = await request(app)
        .post("/todo/login")
        .send({ username: "jdoe", password: "wrongpass1" });

      expect(res.status).toBe(401);
      expect(res.body.message).toBe("Invalid username or password.");
      expect(res.body.token).toBeUndefined();

      // An unknown username gets the SAME message (it does not reveal which users exist).
      const unknown = await request(app)
        .post("/todo/login")
        .send({ username: "nobody", password: "password123" });
      expect(unknown.status).toBe(401);
      expect(unknown.body.message).toBe("Invalid username or password.");
    });

    it("User signs in with missing username", async () => {
      const res = await request(app).post("/todo/login").send({ password: "password123" });

      expect(res.status).toBe(400);
      expect(res.body.message).toBe("Username is required.");
    });

    it("User signs in with missing password", async () => {
      const res = await request(app).post("/todo/login").send({ username: "jdoe" });

      expect(res.status).toBe(400);
      expect(res.body.message).toBe("Password is required.");
    });
  });

  describe("US-1.4 — Sign out", () => {
    it("User signs out", async () => {
      const registered = (await registerNewUser()).body;

      const res = await request(app)
        .post("/todo/logout")
        .set("Authorization", `Bearer ${registered.token}`);

      expect(res.status).toBe(200);
      expect(res.body.message).toBe("Signed out successfully.");

      // The server cleared the stored token.
      const session = await db.session.findOne({ where: { userId: registered.userId } });
      expect(session.token).toBe("");

      // The old token no longer works.
      const again = await request(app)
        .post("/todo/logout")
        .set("Authorization", `Bearer ${registered.token}`);
      expect(again.status).toBe(401);
    });
  });
});