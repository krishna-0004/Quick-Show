import express from "express";
import { requireAuth } from "../middlewares/auth.mjs";
import { createOrder, razorpayWebhook, confirmPayment } from "../controllers/paymentController.mjs";

const router = express.Router();

router.post("/create-order", requireAuth, createOrder);
router.post("/razorpay/webhook", razorpayWebhook);
router.post("/confirm", requireAuth, confirmPayment); // ✅ new route

export default router;
