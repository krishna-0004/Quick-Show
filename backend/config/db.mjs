// config/db.mjs

// step 1: import required packeges
import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

let isConnected = false;

// step2: create a function to connect the database
export const ConnectDB = async () => {
  if (isConnected) return;

  // setp 3: in try block connect the backned to data base
  try {
    const conn = await mongoose.connect(process.env.MONGO_URL, {
        dbName: process.env.DB_NAME || "quickshow",
    });
    isConnected = true

    console.log(`MongoDB connected: ${conn.connection.host}`);
  } catch (err) {
    // step 4: in catch show the error if data base not connected 
    console.error("Coonection Failed", err.message);
    throw err;
  }
};

//step 5: check the health of the data base
export const checkMongoHealth = async() => {
    try {
        return mongoose.connection.readyState === 1;
    } catch {
        return false
    }
}