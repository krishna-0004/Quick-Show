// utils/seatLock.mjs
import { ConnectRedis } from "../config/redis.mjs";

const redis = ConnectRedis();

const LOCK_PREFIX = "lock:schedule:"; // lock:schedule:<scheduleId>
const defaultTTL = parseInt(process.env.BOOKING_LOCK_TTL_SECONDS || "300", 10);

function getLockField(category, seat) {
  return `${category}:${seat}`; // e.g., "Prime:B2" or "Classic:B2"
}

export async function lockSeats(scheduleId, seats = [], category, ownerId, ttl = defaultTTL) {
  if (!seats || seats.length === 0) return { success: false, message: "No seats requested" };

  const key = `${LOCK_PREFIX}${scheduleId}`;
  const lockFields = seats.map((s) => getLockField(category, s));

  // Lua script same as before, but use lockFields instead of raw seat numbers
  const lua = `
    local key = KEYS[1]
    local ttl = tonumber(ARGV[1])
    local owner = ARGV[2]
    local seatsCount = tonumber(ARGV[3])
    for i=1,seatsCount do
      local field = ARGV[3 + i]
      if (redis.call("HEXISTS", key, field) == 1) then
        return {err = field}
      end
    end
    for i=1,seatsCount do
      local field = ARGV[3 + i]
      redis.call("HSET", key, field, owner)
    end
    redis.call("EXPIRE", key, ttl)
    return {"OK"}
  `;
  
  const argv = [ttl.toString(), ownerId, lockFields.length.toString(), ...lockFields];

  try {
    const res = await redis.eval(lua, 1, key, ...argv);
    return { success: true, lockedSeats: seats };
  } catch (err) {
    const conflict = err.message || err.toString();
    return { success: false, message: `Seat already locked: ${conflict}` };
  }
}

export async function checkLockedSeats(scheduleId, seats = [], category) {
  if (!seats || seats.length === 0) return [];
  const key = `${LOCK_PREFIX}${scheduleId}`;
  const lockFields = seats.map((s) => getLockField(category, s));

  const res = await redis.hmget(key, ...lockFields);
  const conflicts = [];
  for (let i = 0; i < seats.length; i++) {
    if (res[i]) conflicts.push({ seat: seats[i], owner: res[i] });
  }
  return conflicts;
}

export async function unlockSeats(scheduleId, seats = [], category) {
  if (!seats || seats.length === 0) return;
  const key = `${LOCK_PREFIX}${scheduleId}`;
  const lockFields = seats.map((s) => getLockField(category, s));
  await redis.hdel(key, ...lockFields);
}

export async function getLocks(scheduleId) {
  const key = `${LOCK_PREFIX}${scheduleId}`;
  return await redis.hgetall(key);
}

