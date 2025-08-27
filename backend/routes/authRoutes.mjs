// routes/authRoutes.mjs
import express from "express";
import cookieParser from "cookie-parser";
import passport from "passport";
import { createLimiter } from "../middlewares/rateLimit.mjs"; // ✅ new API
import { requireAuth } from "../middlewares/auth.mjs";
import {
  oauthSuccess,
  me,
  refresh,
  logout,
  logoutAll,
} from "../controllers/authController.mjs";

const router = express.Router();

// Middlewares
router.use(cookieParser());

// ✅ Create limiter instances ONCE at startup
const oauthLimiter = createLimiter({
  max: 20,
  windowMs: 60 * 1000,
  prefix: "rl:oauth:",
});
const refreshLimiter = createLimiter({
  max: 30,
  windowMs: 60 * 1000,
  prefix: "rl:refresh:",
});

// Routes
router.get(
  "/google",
  oauthLimiter,
  passport.authenticate("google", { scope: ["profile", "email"], session: false }) // ⬅️ disable sessions
);

router.get(
  "/google/callback",
  oauthLimiter,
  passport.authenticate("google", {
    failureRedirect: `${process.env.FRONTEND_URL}/login?error=oauth`,
    session: false, // ⬅️ disable sessions
  }),
  oauthSuccess
);

router.get("/me", requireAuth, me);

router.post("/refresh", refreshLimiter, refresh);

router.post("/logout", requireAuth, logout);

router.post("/logout-all", requireAuth, logoutAll);

export default router;
