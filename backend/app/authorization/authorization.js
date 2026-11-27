import { Op } from "sequelize";
import db from "../models/index.js";
import logger from "../config/logger.js";

// Check the Bearer token and set req.user for protected routes.
export const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).send({ message: "Unauthorized! No token provided." });
    }

    const token = authHeader.slice(7).trim();
    if (!token) {
      return res.status(401).send({ message: "Unauthorized! No token provided." });
    }

    // The token must exist on a session that has not expired yet.
    const session = await db.session.findOne({
      where: {
        token,
        expirationDate: { [Op.gte]: new Date() },
      },
      include: [{ model: db.user, as: "user" }],
    });

    if (!session || !session.user) {
      return res.status(401).send({ message: "Unauthorized! Invalid or expired token." });
    }

    // Later features use req.user.id to load only this person's data.
    req.user = {
      id: session.user.id,
      role: session.user.role,
    };

    next();
  } catch (err) {
    logger.error(`Session check failed: ${err.message}`);
    return res.status(500).send({ message: "Could not verify the session." });
  }
};

// Load one list only if it belongs to the signed-in user.
// Returns null when the id is missing or owned by someone else (callers send 404).
export const getAccessibleListOrNull = async (req, listId) => {
  const row = await db.list.findOne({
    where: { id: listId, userId: req.user.id },
  });

  return row ?? null;
};

// Load one todo only if it belongs to the signed-in user.
export const getAccessibleTodoOrNull = async (req, todoId) => {
  const row = await db.todo.findOne({
    where: { id: todoId, userId: req.user.id },
  });

  return row ?? null;
};

// Load a user only when the id is the signed-in user. Anyone else looks like "not found".
export const getAccessibleUserOrNull = async (req, userId) => {
  if (Number(userId) !== Number(req.user.id)) {
    return null;
  }

  const row = await db.user.findByPk(userId);
  return row ?? null;
};
