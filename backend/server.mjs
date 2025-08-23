// server.mjs
import dotenv from "dotenv";
dotenv.config();   // ✅ load env first

import http from "http";
import app from "./app.mjs";
import { ConnectDB } from "./config/db.mjs";
import { ConnectRedis } from "./config/redis.mjs";
const PORT = process.env.PORT || 4000;
const server = http.createServer(app);

async function start() {
  try {
    await ConnectDB();
    await ConnectRedis();
    server.listen(PORT, () => {
      console.log(`🚀 Server running at ${process.env.BACKEND_URL || `http://localhost:${PORT}`}`);
    });
  } catch (err) {
    console.error("❌ Failed to start server:", err);
    process.exit(1);
  }
}

// Graceful shutdown
process.on("SIGINT", () => {
  console.log("🛑 Shutting down gracefully...");
  server.close(() => process.exit(0));
});

start();
