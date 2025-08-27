// config/redis.mjs
import Redis from "ioredis";

let redis;

export const ConnectRedis = () => {
  if (!redis) {
    redis = new Redis(process.env.REDIS_URL, {
      // optional: better defaults
      maxRetriesPerRequest: null,
      enableReadyCheck: true,
    });

    redis.on("connect", () => console.log("Redis connected"));
    redis.on("error", (err) => console.error("Redis error:", err));
  }
  return redis;
};

export const getRedis = () => {
  if (!redis) throw new Error("Redis not initialized. Call ConnectRedis() first.");
  return redis;
};

export async function checkRedisHealth() {
  try {
    const r = getRedis();
    const pong = await r.ping();
    return pong === "PONG";
  } catch (err) {
    console.error("Redis health check failed:", err);
    return false;
  }
}
