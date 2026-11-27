import { Router } from "express";
import listController from "../controllers/list.controller.js";
import todoController from "../controllers/todo.controller.js";
import { authenticate } from "../authorization/authorization.js";

const router = Router();

// Mounted at /todo/lists in routes/index.js. Every route needs a valid session.
router.get("/", [authenticate], listController.findAll);
router.post("/", [authenticate], listController.create);
router.put("/:listId", [authenticate], listController.update);
router.delete("/:listId", [authenticate], listController.remove);
// Todos inside one list: /todo/lists/:listId/todos
router.get("/:listId/todos", [authenticate], todoController.findAll);
router.post("/:listId/todos", [authenticate], todoController.create);

export default router;
