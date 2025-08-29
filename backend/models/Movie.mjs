import mongoose from "mongoose";

const movieSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: String,
    language: String,
    genre: [String],
    duration: Number, // minutes
    releaseDate: Date,
    trailerUrl: String,
    posterUrl: String,
    rating: { type: Number, default: 0 }, // avg rating
  },
  { timestamps: true }
);

// 🔹 Indexes
movieSchema.index({ title: "text", genre: 1, language: 1 });
movieSchema.index({ releaseDate: -1 });

export const Movie = mongoose.model("Movie", movieSchema);
