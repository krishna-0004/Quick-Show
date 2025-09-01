// controllers/scheduleController.mjs
import { Schedule } from "../models/Schedule.mjs";
import { Movie } from "../models/Movie.mjs";
import { generateSeats } from "../utils/seatGenerator.mjs";

/**
 * Convert "HH:mm" to minutes
 */
const timeToMinutes = (timeStr) => {
  const [hours, minutes] = timeStr.split(":").map(Number);
  return hours * 60 + minutes;
};

/**
 * Check if two time ranges overlap (in minutes)
 */
const isOverlap = (start1, end1, start2, end2) => {
  return start1 < end2 && start2 < end1;
};

/**
 * Create a new schedule
 */
export const createSchedule = async (req, res) => {
  try {
    const { movieId, date, startTime, endTime, seatCategories } = req.body;

    if (!movieId || !date || !startTime || !endTime || !seatCategories) {
      return res.status(400).json({ success: false, message: "All fields are required" });
    }

    const movie = await Movie.findById(movieId);
    if (!movie) return res.status(404).json({ success: false, message: "Movie not found" });

    // Conflict check
    const existingSchedules = await Schedule.find({ date: new Date(date) });
    const newStart = timeToMinutes(startTime);
    const newEnd = timeToMinutes(endTime);

    for (let s of existingSchedules) {
      const sStart = timeToMinutes(s.startTime);
      const sEnd = timeToMinutes(s.endTime);
      if (isOverlap(newStart, newEnd, sStart, sEnd)) {
        return res.status(400).json({ success: false, message: "Showtime conflict detected" });
      }
    }

    // Generate seats
    const categories = seatCategories.map(cat => {
      const seats = generateSeats(cat.rows, cat.cols);
      return {
        ...cat,
        totalSeats: seats.length,
        availableSeats: seats.length,
        seats,
      };
    });

    const schedule = await Schedule.create({
      movieId,
      date: new Date(date),
      startTime,
      endTime,
      seatCategories: categories,
    });

    res.status(201).json({ success: true, schedule });
  } catch (err) {
    console.error("Create Schedule Error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * Get all schedules with optional filters
 */
export const getSchedules = async (req, res) => {
  try {
    const { movieId, date } = req.query;
    const filter = {};
    if (movieId) filter.movieId = movieId;
    if (date) filter.date = new Date(date);

    const schedules = await Schedule.find(filter)
      .populate("movieId", "title poster")
      .sort({ startTime: 1 });

    res.json({ success: true, count: schedules.length, schedules });
  } catch (err) {
    console.error("Get Schedules Error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * Get schedule by ID
 */
export const getScheduleById = async (req, res) => {
  try {
    const { id } = req.params;
    const schedule = await Schedule.findById(id).populate("movieId", "title poster");

    if (!schedule) return res.status(404).json({ success: false, message: "Schedule not found" });

    res.json({ success: true, schedule });
  } catch (err) {
    console.error("Get Schedule Error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * Update a schedule
 */
export const updateSchedule = async (req, res) => {
  try {
    const { id } = req.params;
    const { movieId, date, startTime, endTime, seatCategories } = req.body;

    const schedule = await Schedule.findById(id);
    if (!schedule) return res.status(404).json({ success: false, message: "Schedule not found" });

    const newDate = date || schedule.date.toISOString().slice(0, 10);
    const newStartTime = startTime || schedule.startTime;
    const newEndTime = endTime || schedule.endTime;

    // Conflict check
    const existingSchedules = await Schedule.find({ date: new Date(newDate), _id: { $ne: id } });
    const newStart = timeToMinutes(newStartTime);
    const newEnd = timeToMinutes(newEndTime);

    for (let s of existingSchedules) {
      const sStart = timeToMinutes(s.startTime);
      const sEnd = timeToMinutes(s.endTime);
      if (isOverlap(newStart, newEnd, sStart, sEnd)) {
        return res.status(400).json({ success: false, message: "Showtime conflict detected" });
      }
    }

    // Update fields
    if (movieId) schedule.movieId = movieId;
    schedule.date = new Date(newDate);
    schedule.startTime = newStartTime;
    schedule.endTime = newEndTime;

    // Update seats if seat config changes
    if (seatCategories) {
      schedule.seatCategories = seatCategories.map(cat => {
        const seats = generateSeats(cat.rows, cat.cols);
        return {
          ...cat,
          totalSeats: seats.length,
          availableSeats: seats.length,
          seats,
        };
      });
    }

    await schedule.save();
    res.json({ success: true, schedule });
  } catch (err) {
    console.error("Update Schedule Error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * Delete a schedule
 */
export const deleteSchedule = async (req, res) => {
  try {
    const { id } = req.params;
    const schedule = await Schedule.findByIdAndDelete(id);

    if (!schedule) return res.status(404).json({ success: false, message: "Schedule not found" });

    res.json({ success: true, message: "Schedule deleted successfully" });
  } catch (err) {
    console.error("Delete Schedule Error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
