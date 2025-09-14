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
  const alreadyProcessed = await redis.get(idempotencyKey);
  if (alreadyProcessed) return;

  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      const booking = await Booking.findOne({ _id: bookingId, userId })
        .session(session)
        .populate("scheduleId");
      if (!booking || booking.bookingStatus !== "locked") {
        throw new Error("Invalid booking");
      }

      if (amount !== booking.amountExpected) {
        throw new Error("Amount mismatch");
      }

      // Mark seats as booked in Schedule
      const schedule = booking.scheduleId;
      const category = schedule.seatCategories.find(c => c.type === booking.category);
      if (!category) throw new Error("Category not found");

      for (const seat of booking.seats) {
        const seatObj = category.seats.find(s => s.seatNumber === seat);
        if (!seatObj || seatObj.isBooked) throw new Error(`Seat ${seat} already booked`);
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

      // Save payment record
      await Payment.create([{
        bookingId,
        userId,
        amount,
        provider,
        transactionId,
        status: "success",
      }], { session });
    });

    // Mark idempotent + unlock Redis seats
    await redis.set(idempotencyKey, "done", "EX", 3600);
    await unlockSeats(booking.scheduleId, booking.seats);
  } finally {
    session.endSession();
  }
}

export { confirmBookingInternal };
