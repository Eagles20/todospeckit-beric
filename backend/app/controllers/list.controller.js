import db from "../models/index.js";
import logger from "../config/logger.js";
import { getAccessibleListOrNull } from "../authorization/authorization.js";

// True when the name was left out or is only spaces.
const isBlank = (value) => typeof value !== "string" || value.trim() === "";

// Check the name before create or rename. Returns a 400 response, or null when the name is ok.
const rejectBadName = (res, name) => {
  if (isBlank(name)) {
    res.status(400).send({ message: "List name is required." });
    return true;
  }

  if (name.trim().length > 100) {
    res.status(400).send({ message: "List name must be 100 characters or fewer." });
    return true;
  }

  return false;
};

const exports = {};

// GET /todo/lists — only this user's lists, A to Z.
exports.findAll = async (req, res) => {
  try {
    const lists = await db.list.findAll({
      where: { userId: req.user.id },
      order: [["name", "ASC"]],
    });

    return res.send(lists);
  } catch (err) {
    logger.error(`List findAll failed: ${err.message}`);
    return res.status(500).send({ message: "Failed to fetch lists." });
  }
};

// POST /todo/lists — owner is always the signed-in user, never a userId from the body.
exports.create = async (req, res) => {
  try {
    const { name } = req.body;

    if (rejectBadName(res, name)) {
      return;
    }

    const list = await db.list.create({
      name: name.trim(),
      userId: req.user.id,
    });

    return res.status(201).send(list);
  } catch (err) {
    logger.error(`List create failed: ${err.message}`);
    return res.status(500).send({ message: "Failed to create list." });
  }
};

// PUT /todo/lists/:listId — rename a list this user owns.
exports.update = async (req, res) => {
  try {
    const listId = parseInt(req.params.listId, 10);
    if (Number.isNaN(listId)) {
      return res.status(400).send({ message: "Invalid list id." });
    }

    const list = await getAccessibleListOrNull(req, listId);
    if (!list) {
      return res.status(404).send({ message: `List with id=${listId} not found.` });
    }

    if (rejectBadName(res, req.body.name)) {
      return;
    }

    // Change the name only. userId stays with the original owner.
    list.name = req.body.name.trim();
    await list.save();

    return res.send(list);
  } catch (err) {
    logger.error(`List update failed: ${err.message}`);
    return res.status(500).send({ message: "Failed to update list." });
  }
};

// DELETE /todo/lists/:listId — remove a list this user owns.
exports.remove = async (req, res) => {
  try {
    const listId = parseInt(req.params.listId, 10);
    if (Number.isNaN(listId)) {
      return res.status(400).send({ message: "Invalid list id." });
    }

    const list = await getAccessibleListOrNull(req, listId);
    if (!list) {
      return res.status(404).send({ message: `List with id=${listId} not found.` });
    }

    await list.destroy();

    return res.status(200).send({ message: "List deleted successfully." });
  } catch (err) {
    logger.error(`List delete failed: ${err.message}`);
    return res.status(500).send({ message: "Failed to delete list." });
  }
};

export default exports;
