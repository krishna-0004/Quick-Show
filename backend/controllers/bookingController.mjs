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
