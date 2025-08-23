import express from "express";
import cookieParser from 'cookie-parser';
import passport from "passport";
import { redisLimiter } from "../middlewares/rateLimit.mjs";
import { requireAuth } from "../middlewares/auth.mjs";
import { oauthSuccess, me, refresh, logout, logoutAll } from '../controllers/authController.mjs';

const router = express.Router();

router.use(cookieParser());

router.get("/google", redisLimiter, passport.authenticate("google", { scope: ["profile", "email"] }));

router.get(
  "/google/callback",
  redisLimiter,
  passport.authenticate("google", { failureRedirect: `${process.env.FRONTEND_URL}/login?error=oauth` }),
  oauthSuccess
);

router.get("/me", requireAuth, me);
router.post("/refresh", redisLimiter, refresh);
router.post("/logout", requireAuth, logout);
router.post("/logout-all", requireAuth, logoutAll);

export default router;