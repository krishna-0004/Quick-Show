// models/Schedule.mjs
import mongoose from "mongoose";
import { generateSeats } from "../utils/seatGenerator.mjs";

const seatCategorySchema = new mongoose.Schema(
  {
    type: { type: String, enum: ["prime", "classic"], required: true },
    price: { type: Number, required: true },
    rows: { type: Number, required: true },
    cols: { type: Number, required: true },
    totalSeats: { type: Number, required: true },
    availableSeats: { type: Number, required: true },
    seats: [
      {
        seatNumber: { type: String, required: true },
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
    date: { type: Date, required: true },        // same date object
    startTime: { type: String, required: true }, // store as "HH:mm"
    endTime: { type: String, required: true },   // store as "HH:mm"
    seatCategories: [seatCategorySchema],
  },
  { timestamps: true }
);

// Auto-generate seats
scheduleSchema.pre("validate", function (next) {
  if (this.isNew && this.seatCategories && this.seatCategories.length > 0) {
    this.seatCategories = this.seatCategories.map((cat) => {
      const generatedSeats = generateSeats(cat.rows, cat.cols);
      return {
        ...cat,
        totalSeats: generatedSeats.length,
        availableSeats: generatedSeats.length,
        seats: generatedSeats,
      };
    });
  }
  next();
});


// Indexes
scheduleSchema.index({ movieId: 1, date: 1, startTime: 1 });

export const Schedule = mongoose.model("Schedule", scheduleSchema);
