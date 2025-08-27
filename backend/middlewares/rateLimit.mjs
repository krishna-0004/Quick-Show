// middlewares/rateLimit.mjs
import rateLimit from "express-rate-limit";
import RedisStore from "rate-limit-redis";
import { getRedis } from "../config/redis.mjs";

const DEFAULTS = {
  windowMs: 60 * 1000, // 1 minute
  max: 200,            // 200 req/min/IP
  prefix: "rl:",
};

/**
 * Creates a Redis-backed rate limiter instance (only call at startup).
 */
export function createLimiter(opts = {}) {
  let redis;
  try {
    redis = getRedis();
  } catch {
    console.warn("⚠️ Redis not initialized, falling back to MemoryStore for rate limiting");
  }

  return rateLimit({
    windowMs: opts.windowMs || DEFAULTS.windowMs,
    max: opts.max || DEFAULTS.max,
    standardHeaders: true,
    legacyHeaders: false,
    store: redis
      ? new RedisStore({
          sendCommand: (...args) => redis.call(...args),
          prefix: opts.prefix || DEFAULTS.prefix,
        })
      : undefined, // Fallback → MemoryStore
    message: { message: "Too many requests, please try again later." },
  });
}

// ✅ Prebuilt reusable instances
export const globalLimiter = createLimiter();
export const authLimiter = createLimiter({ max: 60, prefix: "rl:auth:" });
