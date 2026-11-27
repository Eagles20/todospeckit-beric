import bcrypt from "bcryptjs";
import db from "../models/index.js";
import logger from "../config/logger.js";
import { getAccessibleUserOrNull } from "../authorization/authorization.js";

const SALT_ROUNDS = 10;

const isBlank = (value) => typeof value !== "string" || value.trim() === "";

const exports = {};

// GET /todo/users/:id — only the signed-in user's own profile.
exports.findOne = async (req, res) => {
  try {
    const userId = parseInt(req.params.id, 10);
    if (Number.isNaN(userId)) {
      return res.status(400).send({ message: "Invalid user id." });
    }

    const user = await getAccessibleUserOrNull(req, userId);
    if (!user) {
      return res.status(404).send({ message: `User with id=${userId} not found.` });
    }

    return res.send(user);
  } catch (err) {
    logger.error(`Profile fetch failed: ${err.message}`);
    return res.status(500).send({ message: "Failed to fetch profile." });
  }
};

// PUT /todo/users/:id — update name, email, and username. Password is optional.
exports.update = async (req, res) => {
  try {
    const userId = parseInt(req.params.id, 10);
    if (Number.isNaN(userId)) {
      return res.status(400).send({ message: "Invalid user id." });
    }

    const accessible = await getAccessibleUserOrNull(req, userId);
    if (!accessible) {
      return res.status(404).send({ message: `User with id=${userId} not found.` });
    }

    const { fName, lName, email, username, password } = req.body;

    // A short password is rejected even when other fields are missing.
    if (typeof password === "string" && password.trim() !== "" && password.length < 8) {
      return res.status(400).send({ message: "Password must be at least 8 characters." });
    }

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

    const normalizedUsername = username.trim().toLowerCase();
    const trimmedEmail = email.trim();

    const usernameTaken = await db.user.findOne({ where: { username: normalizedUsername } });
    if (usernameTaken && usernameTaken.id !== userId) {
      return res.status(400).send({ message: "Username is already taken." });
    }

    const emailTaken = await db.user.findOne({ where: { email: trimmedEmail } });
    if (emailTaken && emailTaken.id !== userId) {
      return res.status(400).send({ message: "Email is already registered." });
    }

    // unscoped() is needed only so we can write a new password hash.
    const user = await db.user.unscoped().findByPk(userId);
    user.fName = fName.trim();
    user.lName = lName.trim();
    user.email = trimmedEmail;
    user.username = normalizedUsername;

    if (typeof password === "string" && password.trim() !== "") {
      user.password = await bcrypt.hash(password, SALT_ROUNDS);
    }

    await user.save();

    const safeUser = await db.user.findByPk(userId);
    return res.send(safeUser);
  } catch (err) {
    logger.error(`Profile update failed: ${err.message}`);
    return res.status(500).send({ message: "Failed to update profile." });
  }
};

export default exports;
