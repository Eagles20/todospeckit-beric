import { Router } from "express";
import userController from "../controllers/user.controller.js";
import { authenticate } from "../authorization/authorization.js";

const router = Router();

// Mounted at /todo/users. A person can only read and edit their own id.
router.get("/:id", [authenticate], userController.findOne);
router.put("/:id", [authenticate], userController.update);

export default router;
