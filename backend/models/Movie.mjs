// src/models/Movie.mjs
import mongoose from "mongoose";

const movieSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: String,
    language: String,
    genre: { type: [String], required: true },
    duration: Number, // in minutes
    releaseDate: { type: Date, required: true },
    trailerUrl: String,

    // 🔹 Poster stored in Cloudinary
    poster: {
      url: { type: String, required: true },
      public_id: { type: String, required: true },
    },

    rating: { type: Number, default: 0 }, // avg rating

    // 🔹 Hybrid field
    status: {
      type: String,
      enum: ["now_showing", "coming_soon", "expired"],
      default: "coming_soon",
      index: true, // ✅ keep only one index definition
    },
  },
  { timestamps: true }
);

// 🔹 Indexes for efficient search & filtering
movieSchema.index({ title: "text" });             // Full-text search on title
movieSchema.index({ genre: 1, language: 1 });     // Filter combos
movieSchema.index({ releaseDate: -1 });           // Sort by release date (newest first)

// ❌ removed duplicate: movieSchema.index({ status: 1 });

export const Movie = mongoose.model("Movie", movieSchema);
