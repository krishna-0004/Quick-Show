import { Booking } from "../models/Booking.mjs";
import { Schedule } from "../models/Schedule.mjs";
import { lockSeats, checkLockedSeats } from "../utils/seatLock.mjs";

const CUTOFF_MINUTES = parseInt(process.env.BOOKING_CUTOFF_MINUTES || "90", 10);

export async function postLock(req, res, next) {
  try {
    const { scheduleId, category, seats } = req.body;
    const userId = req.user._id;

    if (!scheduleId || !Array.isArray(seats) || seats.length === 0) {
      return res.status(400).json({ error: "Invalid payload" });
    }

    // Fetch schedule
    const schedule = await Schedule.findById(scheduleId).lean();
    if (!schedule) return res.status(404).json({ error: "Schedule not found" });

    // Compute cutoff
    const [hh, mm] = schedule.startTime.split(":").map(Number);
    const showDate = new Date(schedule.date);
    showDate.setHours(hh, mm, 0, 0);
    const cutoff = new Date(showDate.getTime() - CUTOFF_MINUTES * 60 * 1000);
    if (Date.now() > cutoff.getTime()) {
      return res.status(403).json({ error: "Booking closed for this show (cutoff passed)" });
    }

    // Validate category and seats
    const cat = schedule.seatCategories.find(c => c.type === category);
    if (!cat) return res.status(400).json({ error: "Invalid category" });

    const availableSeatNumbers = new Set(cat.seats.map(s => s.seatNumber));
    const invalidSeats = seats.filter(s => !availableSeatNumbers.has(s));
    if (invalidSeats.length) {
      return res.status(400).json({ error: "Invalid seat(s) requested", invalid: invalidSeats });
    }

    // ✅ Check Redis locks for conflicts, category-aware
    const conflicts = await checkLockedSeats(scheduleId, seats, category);
    if (conflicts.length) {
      return res.status(409).json({ error: "Some seats already locked", conflicts });
    }

    // Generate unique ownerId
    const ownerId = `${userId}:${Date.now()}`;

    // ✅ Lock seats in Redis (category-aware)
    const lockRes = await lockSeats(scheduleId, seats, category, ownerId);
    if (!lockRes.success) {
      return res.status(409).json({ error: lockRes.message });
    }

    // Compute expected amount server-side
    const amountExpected = seats.length * cat.price;

    // Create DB booking with transactional safety
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
      lockedBy: ownerId,
    });

    return res.json({
      locked: true,
      expiresInSec: parseInt(process.env.BOOKING_LOCK_TTL_SECONDS || "300", 10),
      bookingId: booking._id,
      amountExpected,
      seats,
    });

  } catch (err) {
    console.error("postLock error:", err);
    next(err);
  }
}
