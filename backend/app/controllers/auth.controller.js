import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { Op } from "sequelize";
import db from "../models/index.js";
import authConfig from "../config/auth.config.js";
import logger from "../config/logger.js";

// bcrypt work factor from the spec. Higher is slower and harder to crack.
const SALT_ROUNDS = 10;
// 24 hours, matching the JWT expiresIn of 86400 seconds.
const SESSION_TTL_MS = 24 * 60 * 60 * 1000;

// Flat JSON the client stores. Never include the password hash.
const buildAuthResponse = (user, token) => ({
  userId: user.id,
  username: user.username,
  email: user.email,
  fName: user.fName,
  lName: user.lName,
  role: user.role,
  token,
});

// Reuse a live session for this user, or create a new JWT and session row.
const createOrReuseSession = async (user) => {
  const existingSession = await db.session.findOne({
    where: {
      userId: user.id,
      email: user.email,
      expirationDate: { [Op.gte]: new Date() },
      // Logout clears the token to "". Do not reuse a signed-out row.
      token: { [Op.ne]: "" },
    },
  });

  if (existingSession) {
    return existingSession.token;
  }

  const expirationDate = new Date(Date.now() + SESSION_TTL_MS);
  const token = jwt.sign({ userId: user.id, email: user.email }, authConfig.secret, {
    expiresIn: 86400,
  });

  await db.session.create({
    token,
    email: user.email,
    expirationDate,
    userId: user.id,
  });

  return token;
};

// True when a required text field was left out or is only spaces.
const isBlank = (value) => typeof value !== "string" || value.trim() === "";

const exports = {};

exports.register = async (req, res) => {
  try {
    const { fName, lName, email, username, password } = req.body;

    if (isBlank(fName)) {
      return res.status(400).send({ message: "First name is required." });
    }
    if (isBlank(lName)) {
      return res.status(400).send({ message: "Last name is required." });
    }
    if (isBlank(email)) {
      return res.status(400).send({ message: "Email is required." });
    }
    if (isBlank(username)) {
      return res.status(400).send({ message: "Username is required." });
    }
    if (isBlank(password)) {
      return res.status(400).send({ message: "Password is required." });
    }
    if (password.length < 8) {
      return res.status(400).send({ message: "Password must be at least 8 characters." });
    }

    const normalizedUsername = username.trim().toLowerCase();

    const existingUsername = await db.user.findOne({
      where: { username: normalizedUsername },
    });
    if (existingUsername) {
      return res.status(400).send({ message: "Username is already taken." });
    }

    const existingEmail = await db.user.findOne({
      where: { email: email.trim() },
    });
    if (existingEmail) {
      return res.status(400).send({ message: "Email is already registered." });
    }

    // Hash before save. The User model hides this field on normal queries.
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
    const user = await db.user.create({
      fName: fName.trim(),
      lName: lName.trim(),
      email: email.trim(),
      username: normalizedUsername,
      password: hashedPassword,
      // role defaults to "worker" on the model.
    });

    const token = await createOrReuseSession(user);
    return res.status(201).send(buildAuthResponse(user, token));
  } catch (err) {
    logger.error(`Registration failed: ${err.message}`);
    return res.status(500).send({ message: "Registration failed." });
  }
};

exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (isBlank(username)) {
      return res.status(400).send({ message: "Username is required." });
    }
    if (isBlank(password)) {
      return res.status(400).send({ message: "Password is required." });
    }

    const normalizedUsername = username.trim().toLowerCase();
    // unscoped() is required so we can read the password hash.
    const user = await db.user.unscoped().findOne({
      where: { username: normalizedUsername },
    });

    // Same message for a missing user and a wrong password.
    if (!user) {
      return res.status(401).send({ message: "Invalid username or password." });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(401).send({ message: "Invalid username or password." });
    }

    const token = await createOrReuseSession(user);
    return res.status(200).send(buildAuthResponse(user, token));
  } catch (err) {
    logger.error(`Login failed: ${err.message}`);
    return res.status(500).send({ message: "Login failed." });
  }
};

exports.logout = async (req, res) => {
  try {
    // authenticate already checked this header. Clear the stored token.
    const token = req.headers.authorization.slice(7).trim();
    await db.session.update({ token: "" }, { where: { token } });
    return res.status(200).send({ message: "Signed out successfully." });
  } catch (err) {
    logger.error(`Logout failed: ${err.message}`);
    return res.status(500).send({ message: "Logout failed." });
  }
};

export default exports;
