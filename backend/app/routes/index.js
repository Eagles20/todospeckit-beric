import { Router } from "express";
import authRoutes from "./auth.routes.js";
import listRoutes from "./list.routes.js";

const router = Router();

router.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

// Auth routes sit at the /todo mount: /todo/register, /todo/login, /todo/logout.
router.use("/", authRoutes);
// List routes: /todo/lists
router.use("/lists", listRoutes);

export default router;
