// server.mjs
import dotenv from "dotenv";
dotenv.config();   // ✅ load env first

import http from "http";
import app from "./app.mjs";
import { ConnectDB} from "./config/db.mjs";
import { ConnectRedis, getRedis } from "./config/redis.mjs";

const PORT = process.env.PORT || 4000;
const server = http.createServer(app);

async function start() {
  try {
    // Initialize DB + Redis before server starts
    await ConnectDB();
    await ConnectRedis();

    server.listen(PORT, () => {
      console.log(
        `🚀 Server running at ${process.env.BACKEND_URL || `http://localhost:${PORT}`}`
      );
    });
  } catch (err) {
    console.error("Failed to start server:", err);
    process.exit(1);
  }
}

// Graceful shutdown handler
async function shutdown(signal) {
  console.log(`\nReceived ${signal}, shutting down gracefully...`);

  server.close(async () => {
    try {
      // Close Redis
      const redis = getRedis();
      if (redis) {
        await redis.quit();
        console.log("Redis connection closed");
      }
    } catch (err) {
      console.error("Error during shutdown:", err);
    } finally {
      process.exit(0);
    }
  });
}

// Handle termination signals
["SIGINT", "SIGTERM"].forEach((signal) => {
  process.on(signal, () => shutdown(signal));
});

start();
