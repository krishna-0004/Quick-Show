// utils/redis-session.mjs

// Import Redis connection helper
import { ConnectRedis } from "../config/redis.mjs";


// Key for storing a single refresh token (per device)
const rtKey = (userId, jti) => `rt:${userId}:${jti}`;

// Optional set of all JTIs for a user (used for logoutAll / revoking all refresh tokens)
const rtSetKey = (userId) => `rtidx:${userId}`;

// Connect to Redis
const redis = ConnectRedis();

/**
 * Save a refresh token record in Redis.
 * - `userId` → ID of the user
 * - `jti` → unique token identifier (per-device)
 * - `ttlSeconds` → how long this record should live (matches token expiry)
 * - `meta` → optional metadata (ip, userAgent, createdAt)
 */
export const saveRefreshRecord = async (userId, jti, ttlSeconds, meta = {}) => {
  const key = rtKey(userId, jti);

  // Use multi/exec for atomic operations
  await redis
    .multi()
    .set(key, JSON.stringify(meta), "EX", ttlSeconds) // save token meta with expiration
    .sadd(rtSetKey(userId), jti) // add jti to the user's set of tokens
    .exec();
};

/**
 * Returns true if the refresh token exists in Redis (active), false if revoked/expired
 */
export const isRefreshActive = async (userId, jti) => {
  const key = rtKey(userId, jti);
  return Boolean(await redis.exists(key));
};

/**
 * Revoke a single refresh token (e.g., during logout from one device)
 */
export const deleteRefreshRecord = async (userId, jti) => {
  const key = rtKey(userId, jti);
  await redis
    .multi()
    .del(key) // remove token record
    .srem(rtSetKey(userId), jti) // remove jti from user's set
    .exec();
};

/**
 * Revoke all refresh tokens for a user (logout everywhere)
 * - Used for security: force sign-out from all devices
 * - Also used for detecting token reuse
 */
export const deleteAllRefreshRecords = async (userId) => {
  const setKey = rtSetKey(userId);
  const jtis = await redis.smembers(setKey); // get all JTIs for this user

  if (jtis.length) {
    const keys = jtis.map((j) => rtKey(userId, j));
    await redis.del(...keys); // delete all individual refresh tokens
  }

  await redis.del(setKey); // delete the set itself
};
