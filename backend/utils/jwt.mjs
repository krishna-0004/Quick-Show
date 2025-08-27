// utils/jwt.mjs

import jwt from "jsonwebtoken";

const ACCESS_TTL = process.env.ACCESS_TOKEN_TTL || "15m";

const REFRESH_TTL_DAYS = Number(process.env.REFRESH_TOKEN_TTL_DAYS || 7);


// Generate short-lived Access Token
// - Used for API authentication
// - Includes: user ID, email, role, tokenVersion (tv)
export const signAccessToken = (user) => {
  return jwt.sign(
    {
      id: user._id,
      email: user.email,
      role: user.role,
      tv: user.tokenVersion, // tokenVersion → allows force invalidation of all tokens for a user
    },
    process.env.JWT_ACCESS_SECRET,
    { expiresIn: ACCESS_TTL } 
  );
};

// Generate long-lived Refresh Token
// - Used to get new access tokens after expiration
// - Includes `jti` (JWT ID) → unique per-device, for granular revocation
export const signRefreshToken = (user, jti) => {
  return jwt.sign(
    {
      id: user._id,
      email: user.email,
      role: user.role,
      tv: user.tokenVersion,
      jti,
    },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: `${REFRESH_TTL_DAYS}d` }
  );
};

// Verify Access Token → throws error if invalid/expired
export const verifyAccess = (token) => {
  return jwt.verify(token, process.env.JWT_ACCESS_SECRET);
};

// Verify Refresh Token → throws error if invalid/expired
export const verifyRefresh = (token) => {
  return jwt.verify(token, process.env.JWT_REFRESH_SECRET);
};

// - httpOnly: prevents JS access (mitigates XSS attacks)
// - secure: only send cookie over HTTPS in production
// - sameSite: strict CSRF protection
// - maxAge: matches refresh token TTL
// - path: "/" makes cookie accessible site-wide
export const refreshCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict",
  maxAge: REFRESH_TTL_DAYS * 24 * 60 * 60 * 1000,
  path: "/",
};
