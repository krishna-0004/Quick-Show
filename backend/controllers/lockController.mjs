// controllers/lockController.mjs
import { Booking } from "../models/Booking.mjs";
import { Schedule } from "../models/Schedule.mjs";
import { lockSeats, checkLockedSeats, unlockSeats } from "../utils/seatLock.mjs";
import mongoose from "mongoose";

const CUTOFF_MINUTES = parseInt(process.env.BOOKING_CUTOFF_MINUTES || "90", 10);

export async function postLock(req, res, next) {
  try {
    const { scheduleId, category, seats } = req.body;
    const userId = req.user._id; // assuming auth middleware set req.user

    // Basic validation (use Zod/Joi in real code)
    if (!scheduleId || !Array.isArray(seats) || seats.length === 0) {
      return res.status(400).json({ error: "Invalid payload" });
    }

    // Fetch schedule
    const schedule = await Schedule.findById(scheduleId).lean();
    if (!schedule) return res.status(404).json({ error: "Schedule not found" });

    // compute cutoff: schedule.date + startTime - CUTOFF minutes
    // schedule.date is a Date and startTime is "HH:mm"
    const [hh, mm] = schedule.startTime.split(":").map(Number);
    const showDate = new Date(schedule.date);
    showDate.setHours(hh, mm, 0, 0);
    const cutoff = new Date(showDate.getTime() - CUTOFF_MINUTES * 60 * 1000);
    if (Date.now() > cutoff.getTime()) {
      return res.status(403).json({ error: "Booking closed for this show (cutoff passed)" });
    }

    // validate seats exist inside schedule seatCategories for the requested category
    const cat = schedule.seatCategories.find((c) => c.type === category);
    if (!cat) return res.status(400).json({ error: "Invalid category" });

    const availableSeatNumbers = new Set(cat.seats.map((s) => s.seatNumber));
    const invalid = seats.filter((s) => !availableSeatNumbers.has(s));
    if (invalid.length) {
      return res.status(400).json({ error: "Invalid seat(s) requested", invalid });
    }

    // Check Redis locks for conflicts
    const conflicts = await checkLockedSeats(scheduleId, seats);
    if (conflicts.length) {
      return res.status(409).json({ error: "Some seats already locked", conflicts });
    }

    // ownerId: tie to userId + timestamp/jti to uniquely identify request
    const ownerId = `${userId}:${Date.now()}`;

    // Try lock
    const lockRes = await lockSeats(scheduleId, seats, ownerId);
    if (!lockRes.success) {
      return res.status(409).json({ error: lockRes.message });
    }

    // Create a DB Booking record with bookingStatus 'locked'
    // Store ownerId in Booking.lockedBy (optional) so we can verify release
    const amountExpected = seats.length * cat.price;

    const booking = await Booking.create({
      userId,
      scheduleId,
      category,
      seats,
      amountExpected,
      amountPaid: 0,
      bookingStatus: "locked",
      paymentStatus: "pending",
      lockedAt: new Date(),
      lockedBy: ownerId, // add this field to schema if you want
    });

    // Return lock token info (bookingId used later in confirm)
    return res.json({
      locked: true,
      expiresInSec: parseInt(process.env.BOOKING_LOCK_TTL_SECONDS || "300", 10),
      bookingId: booking._id,
      amountExpected,
      seats,
    });
  } catch (err) {
    next(err);
  }
}
