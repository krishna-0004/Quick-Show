// jobs/runCleanupLocks.mjs
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

// Fix __dirname in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env explicitly
dotenv.config({ path: path.resolve(__dirname, "../.env") });

import { ConnectDB } from "../config/db.mjs";
import { ConnectRedis } from "../config/redis.mjs";
import { cleanupExpiredLocks } from "./cleanupExpiredLocks.mjs";

async function run() {
  try {
    // --- Connect MongoDB ---
    if (!process.env.MONGO_URL) throw new Error("MONGO_URL not defined in .env");
    await ConnectDB();
    console.log("MongoDB connected");

    // --- Connect Redis ---
    if (!process.env.REDIS_URL) throw new Error("REDIS_URL not defined in .env");
    const redis = ConnectRedis();
    
    // Optional: check Redis connection before proceeding
    try {
      const pong = await redis.ping();
      if (pong !== "PONG") throw new Error("Redis did not respond with PONG");
      console.log("Redis connected");
    } catch (err) {
      throw new Error(`Failed to connect to Redis: ${err.message}`);
    }

    // --- Run cleanup job ---
    await cleanupExpiredLocks();
    console.log("Expired locks cleanup done");
    console.log("Using REDIS_URL:", process.env.REDIS_URL);

    process.exit(0); // success
  } catch (err) {
    console.error("Error running cleanup:", err);
    process.exit(1); // failure
  }
}

run();
