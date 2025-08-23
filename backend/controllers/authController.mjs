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

// helper to get RT TTL in seconds (same as cookie maxAge)
const REFRESH_TTL_SEC = Math.floor(
  (process.env.REFRESH_TOKEN_TTL_DAYS ? Number(process.env.REFRESH_TOKEN_TTL_DAYS) : 7) * 24 * 60 * 60
);

export const oauthSuccess = async (req, res) => {
  // req.user is from your OAuth pipeline
  const jti = randomUUID();
  const accessToken = signAccessToken(req.user);
  const refreshToken = signRefreshToken(req.user, jti);

  // store device session in Redis (optional metadata)
  await saveRefreshRecord(
    req.user._id.toString(),
    jti,
    REFRESH_TTL_SEC,
    { ua: req.headers["user-agent"] || "", ip: req.ip, createdAt: Date.now() }
  );

  res.cookie("refreshToken", refreshToken, refreshCookieOptions);
  return res.redirect(`${process.env.FRONTEND_URL}/auth/success?at=1`);
};

export const me = async (req, res) => {
  res.json({ user: req.user });
};

/**
 * Refresh with rotation + reuse detection:
 * - Verify JWT
 * - Check Redis whitelist (userId + jti)
 *   - If missing but JWT valid => reuse suspicion -> nuke all sessions and bump tokenVersion
 * - Rotate: delete old record, issue new jti, save new record, set cookie, return new AT
 */
export const refresh = async (req, res) => {
  try {
    const token = req.cookies?.refreshToken;
    if (!token) return res.status(401).json({ message: "No Refresh Token" });

    const decoded = verifyRefresh(token); // { id, tv, jti, ... }
    const user = await User.findById(decoded.id);
    if (!user) return res.status(401).json({ message: "User not found" });

    // global revoke check
    if (decoded.tv !== user.tokenVersion) {
      return res.status(401).json({ message: "Token revoked" });
    }

    // whitelist check (reuse detection)
    const active = await isRefreshActive(user._id.toString(), decoded.jti);
    if (!active) {
      // Reuse detected: token is valid but not in Redis (was rotated/stolen)
      // Response strategy: revoke everything & bump tokenVersion
      await deleteAllRefreshRecords(user._id.toString());
      await User.findByIdAndUpdate(user._id, { $inc: { tokenVersion: 1 } });
      res.clearCookie("refreshToken", { ...refreshCookieOptions, maxAge: 0 });
      return res.status(401).json({ message: "Suspicious activity detected. Please sign in again." });
    }

    // Rotate: invalidate old RT, issue new RT with new jti
    await deleteRefreshRecord(user._id.toString(), decoded.jti);

    const newJti = randomUUID();
    const accessToken = signAccessToken(user);
    const newRefresh = signRefreshToken(user, newJti);

    await saveRefreshRecord(
      user._id.toString(),
      newJti,
      REFRESH_TTL_SEC,
      { ua: req.headers["user-agent"] || "", ip: req.ip, rotatedFrom: decoded.jti, createdAt: Date.now() }
    );

    res.cookie("refreshToken", newRefresh, refreshCookieOptions);
    return res.json({ accessToken });
  } catch (e) {
    return res.status(401).json({ message: "Invalid Refresh Token" });
  }
};

export const logout = async (req, res) => {
  // Single-device logout: remove the RT record for this cookie's jti
  const token = req.cookies?.refreshToken;
  if (token) {
    try {
      const decoded = verifyRefresh(token);
      await deleteRefreshRecord(decoded.id, decoded.jti);
    } catch {
      // ignore parse errors; just clear cookie
    }
  }
  res.clearCookie("refreshToken", { ...refreshCookieOptions, maxAge: 0 });
  return res.json({ ok: true });
};

export const logoutAll = async (req, res) => {
  // Global logout: nuke all device RTs and bump tv so ATs die instantly
  await deleteAllRefreshRecords(req.user._id.toString());
  await User.findByIdAndUpdate(req.user._id, { $inc: { tokenVersion: 1 } });
  res.clearCookie("refreshToken", { ...refreshCookieOptions, maxAge: 0 });
  return res.json({ ok: true });
};
