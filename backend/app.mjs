import express from "express";
import passport from "./config/passport.mjs";
import { applySecurity } from "./middlewares/security.mjs";
import { redisLimiter } from "./middlewares/rateLimit.mjs";

import healthRoutes from "./routes/health.mjs";
import authRoutes from "./routes/authRoutes.mjs";

const app = express();

// If behind a proxy like Nginx/Render/Heroku
// app.set("trust proxy", 1);

// Apply security middleware stack
applySecurity(app);

// Body parser
app.use(express.json({ limit: "200kb" }));

// Initialize Passport
app.use(passport.initialize());

// Global rate limiter (applies to all /api routes)
app.use("/api", redisLimiter());

// Routes
app.use("/api/health", healthRoutes);
app.use("/api/auth", authRoutes);

// Fallback root
app.get("/", (_req, res) => res.send("Quick Show API 🟢"));

export default app;
