// models/Booking.mjs
import mongoose from "mongoose";

const bookingSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    scheduleId: { type: mongoose.Schema.Types.ObjectId, ref: "Schedule", required: true },

    category: { type: String, required: true }, // prime/classic
    seats: [{ type: String, required: true }],

    amountExpected: { type: Number, required: true },
    amountPaid: { type: Number, default: 0 },

    bookingStatus: {
      type: String,
      enum: ["locked", "confirmed", "cancelled"],
      default: "locked",
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "success", "failed"],
      default: "pending",
    },

    lockedBy: { type: String },         // optional owner id from lock
    providerOrderId: { type: String },

    lockedAt: { type: Date, default: Date.now },
    confirmedAt: { type: Date },
  },
  { timestamps: true }
);

// Indexes
bookingSchema.index({ scheduleId: 1, bookingStatus: 1 });
bookingSchema.index({ userId: 1, scheduleId: 1 });

export const Booking = mongoose.model("Booking", bookingSchema);
