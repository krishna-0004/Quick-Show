// bookingController.mjs
import mongoose from "mongoose";
import { Booking } from "../models/Booking.mjs";
import { Payment } from "../models/Payment.mjs";
import { Schedule } from "../models/Schedule.mjs";
import { getRedis } from "../config/redis.mjs";
import { unlockSeats } from "../utils/seatLock.mjs";

import crypto from "crypto";

/**
 * Confirm booking internally (used by webhook or manual confirm)
 * - Idempotent via Redis key
 * - Updates Booking, Schedule seats, Payment
 */
async function confirmBookingInternal({ bookingId, userId, amount, provider, transactionId }) {
  const redis = getRedis();
  const idempotencyKey = `booking:confirm:${bookingId}`;
  
  // Idempotency check
  const alreadyProcessed = await redis.get(idempotencyKey);
  if (alreadyProcessed) return;

  let booking; // move to outer scope

  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      booking = await Booking.findOne({ _id: bookingId, userId })
        .session(session)
        .populate("scheduleId");

      if (!booking) throw new Error("Booking not found");
      if (booking.bookingStatus !== "locked") throw new Error("Booking not in locked state");

      // Use Math.abs to avoid tiny floating point mismatch
      if (Math.abs(amount - booking.amountExpected) > 0.01) {
        throw new Error(`Amount mismatch. Expected: ${booking.amountExpected}, Got: ${amount}`);
      }

      // Mark seats as booked in Schedule
      const schedule = booking.scheduleId;
      const category = schedule.seatCategories.find(c => c.type === booking.category);
      if (!category) throw new Error("Category not found in schedule");

      for (const seat of booking.seats) {
        const seatObj = category.seats.find(s => s.seatNumber === seat);
        if (!seatObj) throw new Error(`Seat ${seat} not found`);
        if (seatObj.isBooked) throw new Error(`Seat ${seat} already booked`);
        seatObj.isBooked = true;
      }

      category.availableSeats -= booking.seats.length;
      await schedule.save({ session });

      // Update booking
      booking.bookingStatus = "confirmed";
      booking.paymentStatus = "success";
      booking.amountPaid = amount;
      booking.confirmedAt = new Date();
      await booking.save({ session });

      // Save payment record only if not already exists
      const existingPayment = await Payment.findOne({ transactionId }).session(session);
      if (!existingPayment) {
        await Payment.create([{
          bookingId,
          userId,
          amount,
          provider,
          transactionId,
          status: "success",
        }], { session });
      }
    });

    // After transaction: mark idempotent + unlock Redis seats
    if (booking) {
      await redis.set(idempotencyKey, "done", "EX", 3600);
      await unlockSeats(booking.scheduleId._id, booking.seats);
    }

  } catch (err) {
    console.error("confirmBookingInternal error:", err);
    throw err;
  } finally {
    session.endSession();
  }
}

export { confirmBookingInternal };

export const getUserBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({
      userId: req.user._id,
      bookingStatus: "confirmed",
    })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate({
        path: "scheduleId",
        populate: { path: "movieId", select: "title poster duration language" },
      })
      .lean();

    // 🔹 Merge date + startTime → proper JS Date
    const formatted = bookings.map((b) => {
      if (b.scheduleId) {
        const { date, startTime } = b.scheduleId;

        if (date && startTime) {
          const [hours, minutes] = startTime.split(":").map(Number);
          const showDate = new Date(date); // base day
          showDate.setHours(hours, minutes, 0, 0);

          b.scheduleId.showDateTime = showDate;
        }
      }
      return b;
    });

    res.json({ success: true, bookings: formatted });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Failed to fetch bookings" });
  }
};


export const cancelBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id).populate("showId");

    if (!booking) return res.status(404).json({ message: "Booking not found" });

    const showTime = new Date(booking.showId.startTime);
    const now = new Date();
    const diffHours = (showTime - now) / (1000 * 60 * 60);

    if (diffHours < 4) {
      return res.status(400).json({ message: "Booking cannot be cancelled within 4 hours of showtime." });
    }

    booking.status = "cancelled";
    await booking.save();

    res.json({ message: "Booking cancelled successfully", booking });
  } catch (err) {
    res.status(500).json({ message: "Error cancelling booking", error: err.message });
  }
};