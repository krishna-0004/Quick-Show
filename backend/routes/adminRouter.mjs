import { Router } from "express";
import { requireAuth, requireRole } from "../middlewares/auth.mjs";
import {
  getDashboardSummary,
  getSchedules,
  getSeatMapDetails,
  getBookings,
  getPayments,
  getUsers,
  toggleMovieBookingStatus,
} from "../controllers/adminController.mjs";

const router = Router();

router.get("/summary", requireAuth, requireRole("admin"), getDashboardSummary);
router.get("/schedules", requireAuth, requireRole("admin"), getSchedules);
router.get("/schedules/:scheduleId/seats", requireAuth, requireRole("admin"), getSeatMapDetails);
router.get("/bookings", requireAuth, requireRole("admin"), getBookings);
router.get("/payments", requireAuth, requireRole("admin"), getPayments);
router.get("/users", requireAuth, requireRole("admin"), getUsers);
router.patch("/movie/:id/toggle", requireAuth, requireRole("admin"), toggleMovieBookingStatus);

export default router;
