// middlewares/rateLimit.mjs

import rateLimit from "express-rate-limit";
import RedisStore from "rate-limit-redis";
import { getRedis } from "../config/redis.mjs";

// =======================
// Default Rate Limit Settings
// =======================
const DEFAULTS = {
  windowMs: 60 * 1000, // 1 minute window
  max: 200,            // max 200 requests per window per IP
  prefix: "rl:",        // Redis key prefix
};

// =======================
// Create a Redis-backed Rate Limiter
// =======================

/**
 * createLimiter
 * - Returns a rate limiter middleware
 * - If Redis is available → use RedisStore (shared, scalable)
 * - If Redis not available → fallback to in-memory store (not ideal for multiple servers)
 * 
 * Options:
 * - windowMs: time window in ms
 * - max: max requests per IP
 * - prefix: key prefix for Redis
 */
export function createLimiter(opts = {}) {
  let redis;

  try {
    // Attempt to get Redis client
    redis = getRedis();
  } catch {
    // Redis not initialized → fallback to in-memory store
    console.warn("Redis not initialized, falling back to MemoryStore for rate limiting");
  }

  return rateLimit({
    windowMs: opts.windowMs || DEFAULTS.windowMs, // time window
    max: opts.max || DEFAULTS.max,               // max requests
    standardHeaders: true,                        // return rate limit info in `RateLimit-*` headers
    legacyHeaders: false,                         // disable `X-RateLimit-*` headers
    store: redis
      ? new RedisStore({
          sendCommand: (...args) => redis.call(...args), // use Redis client for storage
          prefix: opts.prefix || DEFAULTS.prefix,       // key prefix
        })
      : undefined, // fallback → in-memory store if Redis unavailable
    message: { message: "Too many requests, please try again later." }, // error message
  });
}

// =======================
// Prebuilt Reusable Rate Limiters
// =======================

// Global limiter: applies to all routes (default 200 req/min)
export const globalLimiter = createLimiter();

// Auth limiter: stricter limit for sensitive routes (e.g., login) (60 req/min)
export const authLimiter = createLimiter({ max: 60, prefix: "rl:auth:" });
