import rateLimit from "express-rate-limit";
import RedisStore from "rate-limit-redis";
import { ConnectRedis } from "../config/redis.mjs";

export const redisLimiter = (opts = {}) => {
  const redis = ConnectRedis();
  return rateLimit({
    windowMs: opts.windowMs || 60 * 1000,
    max: opts.max || 200, // 200 req/min/IP global
    standardHeaders: true,
    legacyHeaders: false,
    store: new RedisStore({
      sendCommand: (...args) => redis.call(...args),
      prefix: opts.prefix || "rl:",
    }),
    message: { message: "Too many requests, please try again later."},
  });
};

export const authLimiter = redisLimiter({ max: 60, prefix: "rl:auth:" }); // tighter limits for auth
