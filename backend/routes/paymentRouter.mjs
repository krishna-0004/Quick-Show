import express from "express";
import { requireAuth } from "../middlewares/auth.mjs";
import { createOrder, razorpayWebhook } from "../controllers/paymentController.mjs";

const router = express.Router();

// Create Razorpay order (requires login)
router.post("/create-order", requireAuth, createOrder);

// Razorpay webhook — no auth, needs raw body
router.post(
  "/razorpay/webhook",
  express.raw({ type: "application/json" }),
  razorpayWebhook
);

export default router;
