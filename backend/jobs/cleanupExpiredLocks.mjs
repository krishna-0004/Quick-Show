// jobs/cleanupExpiredLocks.mjs
import mongoose from "mongoose";
import { Booking } from "../models/Booking.mjs";
import { getRedis } from "../config/redis.mjs";
import { unlockSeats } from "../utils/seatLock.mjs";

const LOCK_TTL_SECONDS = parseInt(process.env.BOOKING_LOCK_TTL_SECONDS || "300", 10);

export const cleanupExpiredLocks = async () => {
  const cutoff = new Date(Date.now() - LOCK_TTL_SECONDS * 1000); // use env TTL
  const expired = await Booking.find({
    bookingStatus: "locked",
    lockedAt: { $lt: cutoff },
  }).populate("scheduleId");

  if (expired.length) {
    console.log(`Cleaning up ${expired.length} expired locks`);
  }

  const redis = getRedis();

  for (const booking of expired) {
    const redisKey = `lock:booking:${booking._id}`;
    const exists = await redis.exists(redisKey);

    // Unlock seats in Redis, log errors but continue
    if (booking.scheduleId && booking.seats.length) {
      try {
        await unlockSeats(booking.scheduleId._id, booking.seats);
      } catch (err) {
        console.error(`Failed to unlock seats for booking ${booking._id}:`, err);
      }
    }

    if (!exists) {
      // Update MongoDB booking status
      booking.bookingStatus = "cancelled";
      booking.paymentStatus = "failed";
      try {
        await booking.save();
        console.log(`Booking ${booking._id} cancelled due to expired lock`);
      } catch (err) {
        console.error(`Failed to update booking ${booking._id}:`, err);
      }
    }
  }
};
