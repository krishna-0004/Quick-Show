// server.mjs
import dotenv from "dotenv";
dotenv.config();   // load env first

import http from "http";
import { ConnectDB } from "./config/db.mjs";
import { ConnectRedis, getRedis } from "./config/redis.mjs";

const PORT = process.env.PORT || 4000;
let server;

async function start() {
  try {
    await ConnectDB();
    await ConnectRedis();

    // Import app *after* Redis is connected
    const { default: app } = await import("./app.mjs");

    server = http.createServer(app);

    server.listen(PORT, () => {
      console.log(
        `Server running at ${process.env.BACKEND_URL || `http://localhost:${PORT}`}`
      );
    });
  } catch (err) {
    console.error("Failed to start server:", err);
    process.exit(1);
  }
}

async function shutdown(signal) {
  console.log(`\nReceived ${signal}, shutting down gracefully...`);

  server?.close(async () => {
    try {
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

["SIGINT", "SIGTERM"].forEach((signal) => {
  process.on(signal, () => shutdown(signal));
});

start();
