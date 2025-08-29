import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema(
  {
    bookingId: { type: mongoose.Schema.Types.ObjectId, ref: "Booking", required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    amount: { type: Number, required: true },
    provider: { type: String, enum: ["razorpay", "stripe"], required: true },
    transactionId: { type: String, required: true },
    status: { type: String, enum: ["success", "failed"], required: true },
  },
  { timestamps: true }
);

// 🔹 Indexes
paymentSchema.index({ bookingId: 1 }, { unique: true });
paymentSchema.index({ transactionId: 1 }, { unique: true });
paymentSchema.index({ userId: 1 });

export const Payment = mongoose.model("Payment", paymentSchema);
