// controllers/auth.mjs

import { randomUUID } from "crypto";
import { User } from "../models/user-model.mjs";
import {
  signAccessToken,
  signRefreshToken,
  verifyRefresh,
  refreshCookieOptions,
} from "../utils/jwt.mjs";
import {
  saveRefreshRecord,
  isRefreshActive,
  deleteRefreshRecord,
  deleteAllRefreshRecords,
} from "../utils/redis-session.mjs";

// =======================
// Refresh Token TTL (in seconds)
// Matches cookie maxAge
// =======================
const REFRESH_TTL_SEC = Math.floor(
  (process.env.REFRESH_TOKEN_TTL_DAYS
    ? Number(process.env.REFRESH_TOKEN_TTL_DAYS)
    : 7) * 24 * 60 * 60
);

// =======================
// OAuth Success Callback
// =======================
/**
 * oauthSuccess
 * - Called after successful Google OAuth login
 * - Issues Access + Refresh tokens
 * - Stores refresh session in Redis
 * - Sets refresh cookie & redirects to frontend
 */
export const oauthSuccess = async (req, res) => {
  // `req.user` is set by Passport OAuth pipeline
  const jti = randomUUID(); // unique refresh token ID
  const accessToken = signAccessToken(req.user);
  const refreshToken = signRefreshToken(req.user, jti);

  // Save refresh token record in Redis with metadata (per-device session)
  await saveRefreshRecord(req.user._id.toString(), jti, REFRESH_TTL_SEC, {
    ua: req.headers["user-agent"] || "",
    ip: req.ip,
    createdAt: Date.now(),
  });

  // Set refresh token cookie (HttpOnly, Secure in prod)
  res.cookie("refreshToken", refreshToken, refreshCookieOptions);

  // Redirect to frontend with success flag
  return res.redirect(`${process.env.FRONTEND_URL}/auth/success?at=1`);
};

// =======================
// Current User Endpoint
// =======================
/**
 * me
 * - Returns currently authenticated user
 * - Assumes requireAuth middleware attached user to req.user
 */
export const me = async (req, res) => {
  res.json({ user: req.user });
};

// =======================
// Refresh Token Rotation + Reuse Detection
// =======================
/**
 * refresh
 * - Verifies refresh token
 * - Ensures it’s still active in Redis
 * - Detects token reuse (possible theft) → nuke all sessions
 * - Rotates: deletes old RT, issues new RT+AT, saves new RT in Redis
 */
export const refresh = async (req, res) => {
  try {
    // 1. Extract refresh token from cookie
    const token = req.cookies?.refreshToken;
    if (!token) return res.status(401).json({ message: "No Refresh Token" });

    // 2. Verify and decode refresh token
    const decoded = verifyRefresh(token); // { id, tv, jti, ... }
    const user = await User.findById(decoded.id);
    if (!user) return res.status(401).json({ message: "User not found" });

    // 3. Check global revoke via tokenVersion
    if (decoded.tv !== user.tokenVersion) {
      return res.status(401).json({ message: "Token revoked" });
    }

    // 4. Check Redis whitelist (reuse detection)
    const active = await isRefreshActive(user._id.toString(), decoded.jti);
    if (!active) {
      // Token is valid JWT but missing from Redis → reused/stolen
      await deleteAllRefreshRecords(user._id.toString());
      await User.findByIdAndUpdate(user._id, { $inc: { tokenVersion: 1 } }); // bump version → invalidate ATs
      res.clearCookie("refreshToken", { ...refreshCookieOptions, maxAge: 0 });
      return res
        .status(401)
        .json({ message: "Suspicious activity detected. Please sign in again." });
    }

    // 5. Rotate refresh token → delete old RT, issue new RT
    await deleteRefreshRecord(user._id.toString(), decoded.jti);

    const newJti = randomUUID();
    const accessToken = signAccessToken(user);
    const newRefresh = signRefreshToken(user, newJti);

    await saveRefreshRecord(user._id.toString(), newJti, REFRESH_TTL_SEC, {
      ua: req.headers["user-agent"] || "",
      ip: req.ip,
      rotatedFrom: decoded.jti, // track chain of rotations
      createdAt: Date.now(),
    });

    // 6. Set new refresh cookie + return new access token
    res.cookie("refreshToken", newRefresh, refreshCookieOptions);
    return res.json({ accessToken });
  } catch (e) {
    return res.status(401).json({ message: "Invalid Refresh Token" });
  }
};

// =======================
// Logout (Single Device)
// =======================
/**
 * logout
 * - Removes refresh token for this device/session only
 * - Clears refresh cookie
 */
export const logout = async (req, res) => {
  const token = req.cookies?.refreshToken;
  if (token) {
    try {
      const decoded = verifyRefresh(token);
      await deleteRefreshRecord(decoded.id, decoded.jti); // remove single device record
    } catch {
      // Ignore errors (token invalid/expired)
    }
  }
  res.clearCookie("refreshToken", { ...refreshCookieOptions, maxAge: 0 });
  return res.json({ ok: true });
};

// =======================
// Logout All Devices
// =======================
/**
 * logoutAll
 * - Removes all refresh tokens for the user
 * - Increments tokenVersion (global revoke → ATs invalidated)
 * - Clears refresh cookie
 */
export const logoutAll = async (req, res) => {
  await deleteAllRefreshRecords(req.user._id.toString());
  await User.findByIdAndUpdate(req.user._id, { $inc: { tokenVersion: 1 } });
  res.clearCookie("refreshToken", { ...refreshCookieOptions, maxAge: 0 });
  return res.json({ ok: true });
};
