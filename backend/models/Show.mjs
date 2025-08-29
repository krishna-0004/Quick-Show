import mongoose from "mongoose";

const seatCategorySchema = new mongoose.Schema(
  {
    type: { type: String, enum: ["prime", "classic"], required: true },
    price: { type: Number, required: true },
    rows: { type: Number, required: true },   // e.g., 5 rows
    cols: { type: Number, required: true },   // e.g., 10 cols
    totalSeats: { type: Number, required: true },
    availableSeats: { type: Number, required: true },
    seats: [
      {
        seatNumber: { type: String, required: true }, // e.g., "A1"
        isBooked: { type: Boolean, default: false },
      }
    ]
  },
  { _id: false }
);

const showSchema = new mongoose.Schema(
  {
    movieId: { type: mongoose.Schema.Types.ObjectId, ref: "Movie", required: true },
    showTime: { type: Date, required: true },
    seatCategories: [seatCategorySchema]
  },
  { timestamps: true }
);

// Indexing for fast queries
showSchema.index({ movieId: 1, showTime: 1 });
showSchema.index({ showTime: 1 });

export const Show = mongoose.model("Show", showSchema);
