import Redis from 'ioredis';

let redis;

export const ConnectRedis = () => {
    if (!redis) {
        redis = new Redis(process.env.REDIS_URL);
        redis.on('Connect', () => console.log("Redis Connected"));
        redis.on("error", (err) => console.error("Redis erroor", err));
    }
    return redis;
}

export async function checkRedisHealth() {
  try {
    const pong = await redis.ping();
    return pong === "PONG";
  } catch {
    return false;
  }
}
