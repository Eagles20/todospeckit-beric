import db from "../models/index.js";
import logger from "../config/logger.js";
import { getAccessibleListOrNull, getAccessibleTodoOrNull } from "../authorization/authorization.js";

// True when a title was left out or is only spaces.
const isBlank = (value) => typeof value !== "string" || value.trim() === "";

// Check a title before create or edit. Returns true when a 400 response was sent.
const rejectBadTitle = (res, title) => {
  if (isBlank(title)) {
    res.status(400).send({ message: "Todo title is required." });
    return true;
  }

  if (title.trim().length > 255) {
    res.status(400).send({ message: "Todo title must be 255 characters or fewer." });
    return true;
  }

  return false;
};

// Incomplete tasks first, then oldest first.
const todoOrder = [
  ["completed", "ASC"],
  ["createdAt", "ASC"],
];

const exports = {};

// GET /todo/lists/:listId/todos
exports.findAll = async (req, res) => {
  try {
    const listId = parseInt(req.params.listId, 10);
    if (Number.isNaN(listId)) {
      return res.status(400).send({ message: "Invalid list id." });
    }

    const list = await getAccessibleListOrNull(req, listId);
    if (!list) {
      return res.status(404).send({ message: `List with id=${listId} not found.` });
    }

    const todos = await db.todo.findAll({
      where: { listId, userId: req.user.id },
      order: todoOrder,
    });

    return res.send(todos);
  } catch (err) {
    logger.error(`Todo findAll failed: ${err.message}`);
    return res.status(500).send({ message: "Failed to fetch todos." });
  }
};

// POST /todo/lists/:listId/todos — owner and list come from the server, not the body.
exports.create = async (req, res) => {
  try {
    const listId = parseInt(req.params.listId, 10);
    if (Number.isNaN(listId)) {
      return res.status(400).send({ message: "Invalid list id." });
    }

    const list = await getAccessibleListOrNull(req, listId);
    if (!list) {
      return res.status(404).send({ message: `List with id=${listId} not found.` });
    }

    if (rejectBadTitle(res, req.body.title)) {
      return;
    }

    const todo = await db.todo.create({
      title: req.body.title.trim(),
      listId,
      userId: req.user.id,
    });

    return res.status(201).send(todo);
  } catch (err) {
    logger.error(`Todo create failed: ${err.message}`);
    return res.status(500).send({ message: "Failed to create todo." });
  }
};

// PUT /todo/todos/:id — change title and/or completed. Ownership stays the same.
exports.update = async (req, res) => {
  try {
    const todoId = parseInt(req.params.id, 10);
    if (Number.isNaN(todoId)) {
      return res.status(400).send({ message: "Invalid todo id." });
    }

    const todo = await getAccessibleTodoOrNull(req, todoId);
    if (!todo) {
      return res.status(404).send({ message: `Todo with id=${todoId} not found.` });
    }

    if (Object.prototype.hasOwnProperty.call(req.body, "title")) {
      if (rejectBadTitle(res, req.body.title)) {
        return;
      }
      todo.title = req.body.title.trim();
    }

    if (Object.prototype.hasOwnProperty.call(req.body, "completed")) {
      todo.completed = Boolean(req.body.completed);
    }

    await todo.save();
    return res.send(todo);
  } catch (err) {
    logger.error(`Todo update failed: ${err.message}`);
    return res.status(500).send({ message: "Failed to update todo." });
  }
};

// DELETE /todo/todos/:id
exports.remove = async (req, res) => {
  try {
    const todoId = parseInt(req.params.id, 10);
    if (Number.isNaN(todoId)) {
      return res.status(400).send({ message: "Invalid todo id." });
    }

    const todo = await getAccessibleTodoOrNull(req, todoId);
    if (!todo) {
      return res.status(404).send({ message: `Todo with id=${todoId} not found.` });
    }

    await todo.destroy();
    return res.status(200).send({ message: "Todo deleted successfully." });
  } catch (err) {
    logger.error(`Todo delete failed: ${err.message}`);
    return res.status(500).send({ message: "Failed to delete todo." });
  }
};

export default exports;
