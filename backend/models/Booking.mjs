// models/Booking.mjs
import mongoose from "mongoose";

const bookingSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true, // ✅ fast lookup for user bookings
    },
    scheduleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Schedule",
      required: true,
      index: true, // ✅ fast lookup per show
    },
    category: { type: String, enum: ["prime", "classic"], required: true },
    seats: [{ type: String, required: true }], // e.g. ["A1","A2"]
    amountPaid: { type: Number, required: true },
    paymentStatus: {
      type: String,
      enum: ["pending", "success", "failed"],
      default: "pending",
      index: true, // ✅ useful for payment reconciliation
    },
    bookingStatus: {
      type: String,
      enum: ["locked", "confirmed", "cancelled"],
      default: "locked",
      index: true, // ✅ helps filter active vs cancelled
    },
    lockedAt: {
      type: Date,
      default: Date.now,
      index: { expires: "10m" }, // TTL: auto-remove after 10 min if not confirmed
    },
    confirmedAt: Date,
  },
  { timestamps: true }
);

// Compound Indexes
bookingSchema.index({ scheduleId: 1, bookingStatus: 1 }); // ✅ find all confirmed/cancelled for a show
bookingSchema.index({ userId: 1, scheduleId: 1 });        // ✅ find specific user’s booking for a show
bookingSchema.index({ createdAt: 1 });                    // ✅ for reporting/analytics (by date)

export const Booking = mongoose.model("Booking", bookingSchema);
