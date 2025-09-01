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

    poster: {
      url: { type: String, required: true },
      public_id: { type: String, required: true },
    },

    rating: { type: Number, default: 0 },

    status: {
      type: String,
      enum: ["now_showing", "coming_soon", "expired"],
      default: "coming_soon",
      index: true,
    },
  },
  { timestamps: true }
);

// ✅ Disable language override so MongoDB won’t use your "language" field
movieSchema.index(
  { title: "text", description: "text" },
  { default_language: "none", language_override: "ignored" }
);

movieSchema.index({ genre: 1, language: 1 });
movieSchema.index({ releaseDate: -1 });

export const Movie = mongoose.model("Movie", movieSchema);
