// jobs/runCleanupLocks.mjs
import dotenv from "dotenv";
dotenv.config();

import mongoose from "mongoose";
import { ConnectDB } from "../config/db.mjs";
import { ConnectRedis } from "../config/redis.mjs";
import { cleanupExpiredLocks } from "./cleanupExpiredLocks.mjs";

async function run() {
  try {
    // Connect to MongoDB
    await ConnectDB();
    console.log("MongoDB connected");

    // Connect to Redis
    await ConnectRedis();
    console.log("Redis connected");

    // Run cleanup
    await cleanupExpiredLocks();
    console.log("Expired locks cleanup done");

    process.exit(0); // exit successfully
  } catch (err) {
    console.error("Error running cleanup:", err);
    process.exit(1);
  }
}

run();
