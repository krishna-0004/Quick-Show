// utils/jwt.mjs
import jwt from "jsonwebtoken";

const ACCESS_TTL = process.env.ACCESS_TOKEN_TTL || "15m";
const REFRESH_TTL_DAYS = Number(process.env.REFRESH_TOKEN_TTL_DAYS || 7);

export const signAccessToken = (user) => {
  return jwt.sign(
    { id: user._id, email: user.email, role: user.role, tv: user.tokenVersion },
    process.env.JWT_ACCESS_SECRET,
    { expiresIn: ACCESS_TTL }
  );
};

// NOTE: include `jti` for per-device revocation
export const signRefreshToken = (user, jti) => {
  return jwt.sign(
    { id: user._id, email: user.email, role: user.role, tv: user.tokenVersion, jti },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: `${REFRESH_TTL_DAYS}d` }
  );
};

export const verifyAccess = (token) => {
  return jwt.verify(token, process.env.JWT_ACCESS_SECRET);
};

export const verifyRefresh = (token) => {
  return jwt.verify(token, process.env.JWT_REFRESH_SECRET);
};

export const refreshCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict",
  maxAge: REFRESH_TTL_DAYS * 24 * 60 * 60 * 1000,
  path: "/",
};
