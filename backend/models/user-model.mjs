import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    googleId: { type: String, index: true, unique: true, sparse: true },
    name: String,
    email: { type: String, unique: true, required: true },
    picture: String,
    role: { type: String, enum: ["user", "admin"], default: "user" },
    tokenVersion: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export const User = mongoose.model("User", userSchema);
