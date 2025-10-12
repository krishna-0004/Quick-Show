import express from "express";
import passport from "./config/passport.mjs";
import { applySecurity } from "./middlewares/security.mjs";
import { globalLimiter } from "./middlewares/rateLimit.mjs";

import healthRoutes from "./routes/health.mjs";
import authRoutes from "./routes/authRoutes.mjs";
import moviesRoutes from "./routes/movieRouter.mjs";
import scheduleRouter from "./routes/scheduleRoutes.mjs";
import bookingRouter from "./routes/bookingRouter.mjs";
import paymentRouter from "./routes/paymentRouter.mjs";
import adminRouter from "./routes/adminRouter.mjs";

const app = express();

// Security middleware
applySecurity(app);

// ⚠️ Razorpay webhook raw body
app.use(
  "/api/payment/razorpay/webhook",
  express.raw({ type: "application/json" }),
  (req, _res, next) => {
    req.rawBody = req.body; // save the raw buffer for signature verification
    next();
  }
);

// JSON parser for all other routes
app.use(express.json({ limit: "200kb" }));

// Passport
app.use(passport.initialize());

// Global rate limiter
app.use("/api", globalLimiter);

// Routes
app.use("/api/health", healthRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/movie", moviesRoutes);
app.use("/api/show", scheduleRouter);
app.use("/api/booking", bookingRouter);
app.use("/api/payment", paymentRouter);
app.use("/api/admin", adminRouter);

app.get("/", (_req, res) => res.send("Quick Show API 🟢"));

export default app;
