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
// =======================
const REFRESH_TTL_SEC = Math.floor(
  (process.env.REFRESH_TOKEN_TTL_DAYS
    ? Number(process.env.REFRESH_TOKEN_TTL_DAYS)
    : 7) * 24 * 60 * 60
);

// =======================
// OAuth Success Callback
// =======================
export const oauthSuccess = async (req, res) => {
  // req.user is set by Passport
  let user = await User.findById(req.user._id);

  if (!user) {
    return res.status(401).json({ message: "User not found after OAuth" });
  }

  // 🔑 Assign role (hardcoded admin email)
  if (user.email === "krishnakadukar004@gmail.com") {
    user.role = "admin";
  } else {
    user.role = "user";
  }
  await user.save();

  const jti = randomUUID();
  const accessToken = signAccessToken(user); // now includes role
  const refreshToken = signRefreshToken(user, jti);

  await saveRefreshRecord(user._id.toString(), jti, REFRESH_TTL_SEC, {
    ua: req.headers["user-agent"] || "",
    ip: req.ip,
    createdAt: Date.now(),
  });

  res.cookie("refreshToken", refreshToken, refreshCookieOptions);

  return res.redirect(`${process.env.FRONTEND_URL}/auth/success?at=1`);
};

// =======================
// Current User Endpoint
// =======================
export const me = async (req, res) => {
  res.json({
    user: {
      id: req.user._id,
      email: req.user.email,
      name: req.user.name,
      picture: req.user.picture,
      role: req.user.role, // ✅ include role
    },
  });
};

// =======================
// Refresh Token Rotation
// =======================
export const refresh = async (req, res) => {
  try {
    const token = req.cookies?.refreshToken;
    if (!token) return res.status(401).json({ message: "No Refresh Token" });

    const decoded = verifyRefresh(token);
    const user = await User.findById(decoded.id);
    if (!user) return res.status(401).json({ message: "User not found" });

    if (decoded.tv !== user.tokenVersion) {
      return res.status(401).json({ message: "Token revoked" });
    }

    const active = await isRefreshActive(user._id.toString(), decoded.jti);
    if (!active) {
      await deleteAllRefreshRecords(user._id.toString());
      await User.findByIdAndUpdate(user._id, { $inc: { tokenVersion: 1 } });
      res.clearCookie("refreshToken", { ...refreshCookieOptions, maxAge: 0 });
      return res
        .status(401)
        .json({ message: "Suspicious activity detected. Please sign in again." });
    }

    await deleteRefreshRecord(user._id.toString(), decoded.jti);

    const newJti = randomUUID();
    const accessToken = signAccessToken(user); // ✅ role inside
    const newRefresh = signRefreshToken(user, newJti);

    await saveRefreshRecord(user._id.toString(), newJti, REFRESH_TTL_SEC, {
      ua: req.headers["user-agent"] || "",
      ip: req.ip,
      rotatedFrom: decoded.jti,
      createdAt: Date.now(),
    });

    res.cookie("refreshToken", newRefresh, refreshCookieOptions);
    return res.json({ accessToken });
  } catch (e) {
    return res.status(401).json({ message: "Invalid Refresh Token" });
  }
};

// =======================
// Logout (Single Device)
// =======================
export const logout = async (req, res) => {
  const token = req.cookies?.refreshToken;
  if (token) {
    try {
      const decoded = verifyRefresh(token);
      await deleteRefreshRecord(decoded.id, decoded.jti);
    } catch {
      // Ignore
    }
  }
  res.clearCookie("refreshToken", { ...refreshCookieOptions, maxAge: 0 });
  return res.json({ ok: true });
};

// =======================
// Logout All Devices
// =======================
export const logoutAll = async (req, res) => {
  await deleteAllRefreshRecords(req.user._id.toString());
  await User.findByIdAndUpdate(req.user._id, { $inc: { tokenVersion: 1 } });
  res.clearCookie("refreshToken", { ...refreshCookieOptions, maxAge: 0 });
  return res.json({ ok: true });
};
