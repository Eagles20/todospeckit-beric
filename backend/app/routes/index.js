import { Router } from "express";
import authRoutes from "./auth.routes.js";

const router = Router();

router.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

// Auth routes sit at the /todo mount: /todo/register, /todo/login, /todo/logout.
router.use("/", authRoutes);

export default router;
