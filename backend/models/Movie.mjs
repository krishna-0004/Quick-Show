// models/Movie.mjs
import mongoose from "mongoose";

const movieSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: String,
    language: String,
    genre: [String],
    duration: Number, // in minutes
    releaseDate: { type: Date, required: true },
    trailerUrl: String,
    posterUrl: String,
    rating: { type: Number, default: 0 }, // avg rating

    // 🔹 Hybrid field
    status: {
      type: String,
      enum: ["now_showing", "coming_soon", "expired"],
      default: "coming_soon",
      index: true, // ✅ for faster filtering
    },
  },
  { timestamps: true }
);

// 🔹 Indexes for search & filtering
movieSchema.index({ title: "text", genre: 1, language: 1 });
movieSchema.index({ releaseDate: -1 });
movieSchema.index({ status: 1 });

export const Movie = mongoose.model("Movie", movieSchema);
