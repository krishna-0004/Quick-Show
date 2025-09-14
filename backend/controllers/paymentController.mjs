import Razorpay from "razorpay";
import { Booking } from "../models/Booking.mjs";
import { Schedule } from "../models/Schedule.mjs";
import { confirmBookingInternal } from "./bookingController.mjs";
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

    // Recompute amount server-side to avoid tampering
    const schedule = await Schedule.findById(booking.scheduleId).lean();
    const cat = schedule.seatCategories.find((c) => c.type === booking.category);
    if (!cat) return res.status(400).json({ error: "Invalid category in booking" });

    const expected = cat.price * booking.seats.length;
    if (expected !== booking.amountExpected) {
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
      .update(req.rawBody)
      .digest("hex");

    if (signature !== expectedSignature) {
      return res.status(400).json({ message: "Invalid signature" });
    }

    const event = req.body;

    if (event.event === "payment.captured") {
      const { order_id, id: paymentId, amount } = event.payload.payment.entity;

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
