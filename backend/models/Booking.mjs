import mongoose from "mongoose";

const bookingSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    showId: { type: mongoose.Schema.Types.ObjectId, ref: "Show", required: true },
    category: { type: String, enum: ["prime", "classic"], required: true },
    seats: [{ type: String, required: true }],
    amountPaid: { type: Number, required: true },
    paymentStatus: { type: String, enum: ["pending", "success", "failed"], default: "pending" },
    bookingStatus: { type: String, enum: ["locked", "confirmed", "cancelled"], default: "locked" },
    lockedAt: { type: Date, default: Date.now }, // for TTL expiry
    confirmedAt: Date,
  },
  { timestamps: true }
);

// 🔹 Indexes
bookingSchema.index({ userId: 1, showId: 1 });
bookingSchema.index({ showId: 1, bookingStatus: 1 });
bookingSchema.index({ lockedAt: 1 }, { expireAfterSeconds: 600 }); // auto expire stale locks

export const Booking = mongoose.model("Booking", bookingSchema);
