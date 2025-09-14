// utils/seatLock.mjs
import { ConnectRedis } from "../config/redis.mjs";

const redis = ConnectRedis();

const LOCK_PREFIX = "lock:schedule:"; // lock:schedule:<scheduleId>
const OWNER_PREFIX = "owner:lock:";    // owner:lock:<scheduleId>:<seat> -> metadata (user/session)

const defaultTTL = parseInt(process.env.BOOKING_LOCK_TTL_SECONDS || "300", 10);

/**
 * Atomically lock multiple seats for a schedule.
 * Returns { success: boolean, lockedSeats: [seat], message }
 *
 * Approach: Use a hash key per schedule storing seat -> ownerId.
 * We'll use EVAL lua script to check none of the seats exist, then set them and set TTL atomically.
 */
export async function lockSeats(scheduleId, seats = [], ownerId, ttl = defaultTTL) {
  if (!seats || !seats.length) {
    return { success: false, message: "No seats requested" };
  }

  const key = `${LOCK_PREFIX}${scheduleId}`;

  // Lua: for given hash key, check fields none exists, then HMSET and EXPIRE
  const lua = `
    local key = KEYS[1]
    local ttl = tonumber(ARGV[1])
    local owner = ARGV[2]
    local seatsCount = tonumber(ARGV[3])
    -- check each seat
    for i=1,seatsCount do
      local field = ARGV[3 + i]
      if (redis.call("HEXISTS", key, field) == 1) then
        return {err = field} -- indicate the first conflicting seat
      end
    end
    -- set owner for seats
    for i=1,seatsCount do
      local field = ARGV[3 + i]
      redis.call("HSET", key, field, owner)
    end
    redis.call("EXPIRE", key, ttl)
    return {"OK"}
  `;

  const argv = [ttl.toString(), ownerId, seats.length.toString(), ...seats];

  try {
    const res = await redis.eval(lua, 1, key, ...argv);
    // If Lua returned an error (conflict), ioredis throws. We handle thrown errors separately.
    return { success: true, lockedSeats: seats };
  } catch (err) {
    // If err.message contains the conflicting seat returned from Lua, parse it
    const conflict = err.message || err.toString();
    // If Lua returned a custom error string, it will be included
    return { success: false, message: `Seat already locked: ${conflict}` };
  }
}

/**
 * Unlock seats for a schedule (delete fields). No TTL handling needed.
 */
export async function unlockSeats(scheduleId, seats = []) {
  if (!seats || !seats.length) return;
  const key = `${LOCK_PREFIX}${scheduleId}`;
  await redis.hdel(key, ...seats);
}

/**
 * Get current locks (for debug / UI)
 * returns { seat: ownerId, ... }
 */
export async function getLocks(scheduleId) {
  const key = `${LOCK_PREFIX}${scheduleId}`;
  return await redis.hgetall(key);
}

/**
 * Check if any seat is locked (return conflicting seats array)
 */
export async function checkLockedSeats(scheduleId, seats = []) {
  if (!seats || seats.length === 0) return [];
  const key = `${LOCK_PREFIX}${scheduleId}`;
  const res = await redis.hmget(key, ...seats); // returns list of owner or null
  const conflicts = [];
  for (let i = 0; i < seats.length; i++) {
    if (res[i]) conflicts.push({ seat: seats[i], owner: res[i] });
  }
  return conflicts;
}
