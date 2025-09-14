import express from "express";
import { requireAuth } from "../middlewares/auth.mjs";
import { postLock } from "../controllers/lockController.mjs";

const router = express.Router();

// Seat Locking / Booking creation
router.post("/lock", requireAuth, postLock);

export default router;
