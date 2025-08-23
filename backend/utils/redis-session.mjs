// utils/redis-session.mjs
import { ConnectRedis } from "../config/redis.mjs";

// Key helpers
const rtKey = (userId, jti) => `rt:${userId}:${jti}`;      // per-device RT record
const rtSetKey = (userId) => `rtidx:${userId}`;            // optional index of JTIs per user

const redis = ConnectRedis();

/**
 * Save a refresh token record in Redis with TTL matching token expiry.
 * `meta` is optional (ip, ua, createdAt)
 */
export const saveRefreshRecord = async (userId, jti, ttlSeconds, meta = {}) => {
  const key = rtKey(userId, jti);
  await redis.multi()
    .set(key, JSON.stringify(meta), "EX", ttlSeconds)
    .sadd(rtSetKey(userId), jti) // for logoutAll per-device cleanups
    .exec();
};

export const isRefreshActive = async (userId, jti) => {
  const key = rtKey(userId, jti);
  return Boolean(await redis.exists(key));
};

export const deleteRefreshRecord = async (userId, jti) => {
  const key = rtKey(userId, jti);
  await redis.multi()
    .del(key)
    .srem(rtSetKey(userId), jti)
    .exec();
};

/**
 * Revoke all refresh tokens for a user (device sign-out everywhere).
 * Also used for reuse detection response.
 */
export const deleteAllRefreshRecords = async (userId) => {
  const setKey = rtSetKey(userId);
  const jtis = await redis.smembers(setKey);
  if (jtis.length) {
    const keys = jtis.map((j) => rtKey(userId, j));
    await redis.del(...keys);
  }
  await redis.del(setKey);
};
