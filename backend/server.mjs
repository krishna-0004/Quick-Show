import app from "./app.mjs";
import dotenv from 'dotenv';
import http from 'http';
import { ConnectDB } from "./config/db.mjs";
import { connectRedis } from "./config/redis.mjs";

dotenv.config();

const PORT = process.env.PORT || 5000
const server = http.createServer(app)

const start = async () => {
    await ConnectDB();
    connectRedis()
    server.listen(PORT, () => {
        console.log(`Server running on http://localhost:${PORT}`);
    })
}
process.on("SIGINT", async () => {
  console.log("🛑 Server shutting down...");
  server.close(() => {
    console.log("✅ HTTP server closed");
    process.exit(0);
  });
});

start();