import { Router } from "express";
import {
  createSchedule,
  getSchedules,
  getScheduleById,
  updateSchedule,
  deleteSchedule,
} from "../controllers/scheduleController.mjs";
import { requireAuth, requireRole } from "../middlewares/auth.mjs";
import { createLimiter } from "../middlewares/rateLimit.mjs";

const router = Router();

// ✅ Rate limiter
const scheduleLimiter = createLimiter({ max: 100, prefix: "rl:schedules:" });

/**
 * Public Routes
 */
router.get("/", scheduleLimiter, getSchedules);     // list all shows
router.get("/:id", scheduleLimiter, getScheduleById); // single show by id

/**
 * Admin Routes
 */
router.post("/", requireAuth, requireRole("admin"), createSchedule);
router.put("/:id", requireAuth, requireRole("admin"), updateSchedule);
router.delete("/:id", requireAuth, requireRole("admin"), deleteSchedule);

export default router;
