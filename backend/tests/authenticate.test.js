import express from "express";
import request from "supertest";
import app from "../server.js";
import db from "../app/models/index.js";
import { authenticate } from "../app/authorization/authorization.js";
import { syncTestDatabase } from "./helpers.js";

// A tiny test-only app. It has ONE route that uses the authenticate middleware.
// The spec uses GET /todo/lists, but lists belong to Feature 2, so we do not build it here.
const protectedApp = express();
protectedApp.get("/protected", authenticate, (req, res) => {
  // authenticate sets req.user.id from the session token (FR-008).
  res.status(200).send({ userId: req.user.id });
});

// Helper: register a user through the real API and return the payload (with token).
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

beforeEach(async () => {
  await syncTestDatabase();
});

afterAll(async () => {
  await db.sequelize.close();
});

describe("Feature 1 — authenticate middleware", () => {
  describe("US-1.3 — Stay signed in across page loads", () => {
    it("API request includes session token", async () => {
      const user = await registerUser("usera", "a@example.com");

      const res = await request(protectedApp)
        .get("/protected")
        .set("Authorization", `Bearer ${user.token}`);

      // A request with the Bearer header is accepted and identifies the user.
      expect(res.status).toBe(200);
      expect(res.body.userId).toBe(user.userId);
    });

    it("Protected API request succeeds with a valid session", async () => {
      const userA = await registerUser("usera", "a@example.com");
      const userB = await registerUser("userb", "b@example.com");

      const res = await request(protectedApp)
        .get("/protected")
        .set("Authorization", `Bearer ${userA.token}`);

      // The request is resolved to user A only, never to user B.
      expect(res.status).toBe(200);
      expect(res.body.userId).toBe(userA.userId);
      expect(res.body.userId).not.toBe(userB.userId);
    });

    it("Expired or invalid session token", async () => {
      const user = await registerUser("usera", "a@example.com");

      // Make the session expire one second in the past.
      await db.session.update(
        { expirationDate: new Date(Date.now() - 1000) },
        { where: { token: user.token } }
      );

      const expired = await request(protectedApp)
        .get("/protected")
        .set("Authorization", `Bearer ${user.token}`);
      expect(expired.status).toBe(401);
      expect(expired.body.message).toBe("Unauthorized! Invalid or expired token.");

      // A made-up token is also rejected.
      const invalid = await request(protectedApp)
        .get("/protected")
        .set("Authorization", "Bearer not-a-real-token");
      expect(invalid.status).toBe(401);
      expect(invalid.body.message).toBe("Unauthorized! Invalid or expired token.");
    });
  });

  describe("US-1.5 — Block unauthenticated access", () => {
    it("Unauthenticated user accesses a protected route", async () => {
      // No Authorization header at all.
      const res = await request(protectedApp).get("/protected");
      expect(res.status).toBe(401);
      expect(res.body.message).toBe("Unauthorized! No token provided.");

      // A header that does not start with "Bearer " is rejected too.
      const wrongScheme = await request(protectedApp)
        .get("/protected")
        .set("Authorization", "Token abc");
      expect(wrongScheme.status).toBe(401);

      // The real logout route is protected the same way.
      const logout = await request(app).post("/todo/logout");
      expect(logout.status).toBe(401);
    });
  });
});