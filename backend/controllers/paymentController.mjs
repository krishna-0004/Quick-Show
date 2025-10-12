// controllers/paymentController.mjs
import Razorpay from "razorpay";
import { Booking } from "../models/Booking.mjs";
import { Schedule } from "../models/Schedule.mjs";
import { confirmBookingInternal } from "./bookingController.mjs";
import { sendBookingEmail } from "../utils/sendBookingEmail.mjs";
import crypto from "crypto";

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

export async function createOrder(req, res, next) {
  try {
    const { bookingId } = req.body;
    const userId = req.user._id;

    if (!bookingId) return res.status(400).json({ error: "bookingId required" });

    const booking = await Booking.findById(bookingId);
    if (!booking) return res.status(404).json({ error: "Booking not found" });
    if (!booking.userId.equals(userId)) return res.status(403).json({ error: "Not your booking" });

    if (booking.bookingStatus !== "locked") {
      return res.status(400).json({ error: "Booking not in locked state" });
    }

    const schedule = await Schedule.findById(booking.scheduleId).lean();
    const cat = schedule.seatCategories.find((c) => c.type === booking.category);
    if (!cat) return res.status(400).json({ error: "Invalid category in booking" });

    const expected = cat.price * booking.seats.length;
    if (Math.abs(expected - booking.amountExpected) > 0.01) {
      booking.amountExpected = expected;
      await booking.save();
    }

    const amountPaise = Math.round(expected * 100);

    const order = await razorpay.orders.create({
      amount: amountPaise,
      currency: "INR",
      receipt: booking._id.toString(),
      payment_capture: 1,
    });

    booking.providerOrderId = order.id;
    await booking.save();

    return res.json({ order });
  } catch (err) {
    console.error("Error in createOrder:", err);
    next(err);
  }
}

export async function razorpayWebhook(req, res) {
  try {
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
    const signature = req.headers["x-razorpay-signature"];

    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(req.body) // req.body is raw buffer
      .digest("hex");

    if (signature !== expectedSignature) {
      return res.status(400).json({ message: "Invalid signature" });
    }

    const event = JSON.parse(req.body.toString());

    if (event.event === "payment.captured" || event.event === "order.paid") {
      const paymentEntity = event.payload.payment?.entity || event.payload.order?.entity;
      const { order_id, id: paymentId, amount } = paymentEntity;

      const booking = await Booking.findOne({ providerOrderId: order_id });
      if (!booking) return res.status(404).json({ message: "Booking not found" });

      await confirmBookingInternal({
        bookingId: booking._id,
        userId: booking.userId,
        amount: amount / 100,
        provider: "razorpay",
        transactionId: paymentId,
      });
    }

    res.json({ status: "ok" });
  } catch (err) {
    console.error("Webhook processing error:", err);
    res.status(500).json({ message: "Webhook processing failed" });
  }
}

// ✅ NEW: Confirm payment endpoint called from frontend
// ✅ NEW: Confirm payment endpoint called from frontend
export async function confirmPayment(req, res) {
  try {
    const { bookingId, paymentId } = req.body;
    if (!bookingId || !paymentId) {
      return res.status(400).json({ error: "bookingId and paymentId required" });
    }

    const booking = await Booking.findById(bookingId).populate({
      path: "scheduleId",
      populate: { path: "movieId", select: "title" },
    }).populate("userId", "name email"); // populate email & name

    if (!booking) return res.status(404).json({ error: "Booking not found" });

    await confirmBookingInternal({
      bookingId,
      userId: booking.userId._id,
      amount: booking.amountExpected,
      provider: "razorpay",
      transactionId: paymentId,
    });

    // Commented out email sending for now
    /*
    await sendBookingEmail({
      email: booking.userId.email,
      fullName: booking.userId.name || "User",
      bookingId: booking._id,
      movieName: booking.scheduleId.movieId.title,
      showDateTime: booking.scheduleId.showDateTime,
      seatType: booking.category,
      seats: booking.seats,
      totalAmount: booking.amountPaid,
      transactionId: paymentId, // pass transactionId for email/template
    });
    */

    res.json({ 
      success: true, 
      message: "Booking confirmed", // removed "email sent"
      bookingId: booking._id,
      transactionId: paymentId,
    });
  } catch (err) {
    console.error("Confirm payment error:", err);
    res.status(500).json({ error: "Booking confirmation failed" });
  }
}


