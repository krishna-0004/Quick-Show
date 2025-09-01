// models/Schedule.mjs
import mongoose from "mongoose";

const seatCategorySchema = new mongoose.Schema(
  {
    type: { type: String, enum: ["prime", "classic"], required: true },
    price: { type: Number, required: true },
    rows: { type: Number, required: true }, // e.g., 5 rows
    cols: { type: Number, required: true }, // e.g., 10 cols
    totalSeats: { type: Number, required: true },
    availableSeats: { type: Number, required: true },
    seats: [
      {
        seatNumber: { type: String, required: true }, // e.g., "A1"
        isBooked: { type: Boolean, default: false },
      },
    ],
  },
  { _id: false }
);

const scheduleSchema = new mongoose.Schema(
  {
    movieId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Movie",
      required: true,
      index: true,
    },
    date: { type: Date, required: true }, // 📅 which day this schedule belongs to
    startTime: { type: Date, required: true }, // ⏰ when show starts
    endTime: { type: Date, required: true },   // ⏰ when show ends

    seatCategories: [seatCategorySchema],
  },
  { timestamps: true }
);

// ✅ Indexing for fast queries
scheduleSchema.index({ movieId: 1, date: 1, startTime: 1 }); // find shows by movie & time
scheduleSchema.index({ date: 1, startTime: 1 }); // list shows by day
scheduleSchema.index({ startTime: 1, endTime: 1 }); // conflict detection

export const Schedule = mongoose.model("Schedule", scheduleSchema);
