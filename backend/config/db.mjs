import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

let isConnected = false;

export const ConnectDB = async () => {
  if (isConnected) return;

  try {
    const conn = await mongoose.connect(process.env.MONGO_URL, {
        dbName: process.env.DB_NAME || "quickshow",
    });
    isConnected = true

    console.log(`MongoDB connected: ${conn.connection.host}`);
  } catch (err) {
    console.error("Coonection Failed", err.message);
    throw err;
  }
};


export const checkMongoHealth = async() => {
    try {
        return mongoose.connection.readyState === 1;
    } catch {
        return false
    }
}