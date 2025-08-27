// routes/authRoutes.mjs

import express from "express";
import cookieParser from "cookie-parser";
import passport from "passport";
import { createLimiter } from "../middlewares/rateLimit.mjs"; 
import { requireAuth } from "../middlewares/auth.mjs";
import {
  oauthSuccess,
  me,
  refresh,
  logout,
  logoutAll,
} from "../controllers/authController.mjs";

const router = express.Router();

// =======================
// Middlewares
// =======================

// Parse cookies (needed for refresh token handling)
router.use(cookieParser());

// ✅ Create rate limiter instances ONCE at startup (per route-type)
const oauthLimiter = createLimiter({
  max: 20,                // max 20 requests per minute
  windowMs: 60 * 1000,    // 1 minute window
  prefix: "rl:oauth:",    // Redis prefix for oauth-related routes
});

const refreshLimiter = createLimiter({
  max: 30,                // max 30 refresh calls per minute
  windowMs: 60 * 1000,    // 1 minute window
  prefix: "rl:refresh:",  // Redis prefix for refresh route
});

// =======================
// Routes
// =======================

/**
 * Google OAuth entrypoint
 * - Uses Passport Google strategy
 * - Scope requests profile + email
 * - Stateless: no sessions (JWT based auth only)
 */
router.get(
  "/google",
  oauthLimiter,
  passport.authenticate("google", {
    scope: ["profile", "email"],
    session: false,
  })
);

/**
 * Google OAuth callback
 * - Handles provider callback
 * - Redirects to frontend (success or failure)
 * - Stateless: no sessions (JWT based auth only)
 */
router.get(
  "/google/callback",
  oauthLimiter,
  passport.authenticate("google", {
    failureRedirect: `${process.env.FRONTEND_URL}/login?error=oauth`,
    session: false,
  }),
  oauthSuccess
);

/**
 * Get current logged-in user
 * - Requires valid access token
 */
router.get("/me", requireAuth, me);

/**
 * Refresh token rotation + reuse detection
 * - Rate limited to prevent brute-force
 */
router.post("/refresh", refreshLimiter, refresh);

/**
 * Logout current device/session
 */
router.post("/logout", requireAuth, logout);

/**
 * Logout from all devices/sessions
 */
router.post("/logout-all", requireAuth, logoutAll);

export default router;
