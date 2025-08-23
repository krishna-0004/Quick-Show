import { User } from "../models/user-model.mjs";
import { verifyAccess } from "../utils/jwt.mjs";

export const requireAuth = async (req, res, next) => {
  try {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : null;
    if (!token) return res.status(401).json({ message: "Not authenticated" });

    const decoded = verifyAccess(token);

    const user = await User.findById(decoded.id).select("-googleId");
    if (!user) return res.status(401).json({ message: "User not found" });

    if (decoded.tv !== user.tokenVersion) {
      return res.status(401).json({ message: "Token revoked" });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};

export const requireRole = (role) => (req, res, next) => {
  if (!req.user || req.user.role !== role) {
    return res.status(403).json({ message: "Forbidden" });
  }
  next();
};
