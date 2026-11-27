import { Router } from "express";
import authController from "../controllers/auth.controller.js";
import { authenticate } from "../authorization/authorization.js";

const router = Router();

// Mounted at /todo in server.js, so these are /todo/register, /todo/login, /todo/logout.
router.post("/register", authController.register);
router.post("/login", authController.login);
// Logout needs a valid session. authenticate runs before the controller.
router.post("/logout", [authenticate], authController.logout);

export default router;
