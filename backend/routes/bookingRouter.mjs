//bookingROuter.mjs
import express from "express";
import { requireAuth } from "../middlewares/auth.mjs";
import { postLock } from "../controllers/lockController.mjs";
import { getUserBookings, cancelBooking } from "../controllers/bookingController.mjs";

const router = express.Router();

// Seat Locking / Booking creation
router.post("/lock", requireAuth, postLock);
router.get("/my", requireAuth, getUserBookings);   // fetch last 5 bookings
router.post("/cancel/:id", requireAuth, cancelBooking);  // cancel booking

export default router;
