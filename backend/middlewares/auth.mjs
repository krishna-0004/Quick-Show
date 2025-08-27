// middlewares/auth.mjs

import { User } from "../models/user-model.mjs";
import { verifyAccess } from "../utils/jwt.mjs";

/**
 * requireAuth
 * - Protects routes by requiring a valid access token
 * - Steps:
 *   1. Extract token from `Authorization` header (Bearer token)
 *   2. Verify the token using `verifyAccess`
 *   3. Fetch the user from DB
 *   4. Check tokenVersion (tv) for revocation
 *   5. Attach user to `req.user` for downstream handlers
 */
export const requireAuth = async (req, res, next) => {
  try {
    // 1. Extract token from header
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : null;
    if (!token) return res.status(401).json({ message: "Not authenticated" });

    // 2. Verify JWT access token
    const decoded = verifyAccess(token);

    // 3. Find user in DB (exclude googleId for security/privacy)
    const user = await User.findById(decoded.id).select("-googleId");
    if (!user) return res.status(401).json({ message: "User not found" });

    // 4. Check tokenVersion to detect revoked tokens
    if (decoded.tv !== user.tokenVersion) {
      return res.status(401).json({ message: "Token revoked" });
    }

    // 5. Attach user object to request for downstream access
    req.user = user;
    next();
  } catch (err) {
    // Token invalid or expired
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};

/**
 * requireRole
 * - Protects routes by role
 * - Usage: requireRole("admin")
 * - Checks `req.user.role` matches the required role
 */
export const requireRole = (role) => (req, res, next) => {
  if (!req.user || req.user.role !== role) {
    return res.status(403).json({ message: "Forbidden" });
  }
  next();
};
