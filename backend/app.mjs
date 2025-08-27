import express from "express";
import passport from "./config/passport.mjs";
import { applySecurity } from "./middlewares/security.mjs";
import { globalLimiter } from "./middlewares/rateLimit.mjs";

import healthRoutes from "./routes/health.mjs";
import authRoutes from "./routes/authRoutes.mjs";

const app = express();

// app.set("trust proxy", 1);

// Security middleware
applySecurity(app);

// Body parser
app.use(express.json({ limit: "200kb" }));

// Passport
app.use(passport.initialize());

// Global rate limiter (created ONCE at startup)
app.use("/api", globalLimiter);

// Routes
app.use("/api/health", healthRoutes);
app.use("/api/auth", authRoutes);

app.get("/", (_req, res) => res.send("Quick Show API 🟢"));

export default app;
