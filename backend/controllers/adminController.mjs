import { Movie } from "../models/Movie.mjs";
import { Schedule } from "../models/Schedule.mjs";
import { Booking } from "../models/Booking.mjs";
import { Payment } from "../models/Payment.mjs";
import { User } from "../models/user-model.mjs";
import mongoose from "mongoose";

/* -------------------------------------------------------------------------- */
/* 📊 1. Dashboard Summary */
/* -------------------------------------------------------------------------- */
export const getDashboardSummary = async (req, res) => {
  try {
    const [movieCount, showCount, userCount, bookingAgg, paymentAgg] =
      await Promise.all([
        Movie.countDocuments(),
        Schedule.countDocuments(),
        User.countDocuments(),
        Booking.aggregate([
          { $match: { bookingStatus: "confirmed" } },
          {
            $group: {
              _id: null,
              totalBookings: { $sum: 1 },
              totalSeats: { $sum: { $size: "$seats" } },
            },
          },
        ]),
        Payment.aggregate([
          { $match: { status: "success" } },
          { $group: { _id: null, totalRevenue: { $sum: "$amount" } } },
        ]),
      ]);

    res.status(200).json({
      success: true,
      summary: {
        totalMovies: movieCount,
        totalShows: showCount,
        totalUsers: userCount,
        totalBookings: bookingAgg[0]?.totalBookings || 0,
        totalSeatsBooked: bookingAgg[0]?.totalSeats || 0,
        totalRevenue: paymentAgg[0]?.totalRevenue || 0,
      },
    });
  } catch (error) {
    console.error("Dashboard summary error:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch summary" });
  }
};

export const getSchedules = async (req, res) => {
  try {
    const schedules = await Schedule.aggregate([
      {
        $lookup: {
          from: "movies",
          localField: "movieId",
          foreignField: "_id",
          as: "movie",
        },
      },
      { $unwind: "$movie" },
      {
        $lookup: {
          from: "bookings",
          localField: "_id",
          foreignField: "scheduleId",
          as: "bookings",
        },
      },
      {
        $addFields: {
          totalSeats: { $sum: "$seatCategories.totalSeats" },
          bookedSeats: {
            // ✅ Sum number of seats in confirmed bookings
            $sum: {
              $map: {
                input: {
                  $filter: {
                    input: "$bookings",
                    as: "b",
                    cond: { $eq: ["$$b.bookingStatus", "confirmed"] },
                  },
                },
                as: "b",
                in: { $size: "$$b.seats" },
              },
            },
          },
          totalRevenue: {
            // ✅ Sum payments for successful transactions
            $sum: {
              $map: {
                input: {
                  $filter: {
                    input: "$bookings",
                    as: "b",
                    cond: { $eq: ["$$b.paymentStatus", "success"] },
                  },
                },
                as: "p",
                in: "$$p.amountPaid",
              },
            },
          },
        },
      },
      {
        $project: {
          _id: 1,
          movieTitle: "$movie.title",
          date: 1,
          startTime: 1,
          endTime: 1,
          totalSeats: 1,
          bookedSeats: 1,
          totalRevenue: 1,
        },
      },
      { $sort: { date: -1 } },
    ]);

    res.json({ success: true, schedules });
  } catch (error) {
    console.error("Schedule summary error:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch schedules" });
  }
};

export const getSeatMapDetails = async (req, res) => {
  try {
    const { scheduleId } = req.params;

    const schedule = await Schedule.findById(scheduleId)
      .populate("movieId", "title duration language")
      .lean();

    if (!schedule) {
      return res
        .status(404)
        .json({ success: false, message: "Schedule not found" });
    }

    // ✅ Get confirmed bookings with user details
    const bookings = await Booking.find({
      scheduleId: new mongoose.Types.ObjectId(scheduleId),
      bookingStatus: "confirmed",
    })
      .populate("userId", "name email")
      .lean();

    // ✅ Get all payments related to these bookings
    const bookingIds = bookings.map((b) => b._id);
    const payments = await Payment.find({
      bookingId: { $in: bookingIds },
    })
      .select("bookingId transactionId amount status")
      .lean();

    const paymentMap = new Map(
      payments.map((p) => [p.bookingId.toString(), p])
    );

    // ✅ Combine booking + payment info for seats
    const seatDetails = bookings.flatMap((b) => {
      const pay = paymentMap.get(b._id.toString());
      return b.seats.map((seat) => ({
        seatNumber: seat,
        userName: b.userId?.name || "Unknown User",
        email: b.userId?.email || "N/A",
        bookingId: b._id,
        paymentId: pay?.transactionId || "N/A",
        amountPaid: pay?.amount || b.amountPaid || 0,
        category: b.category,
        status: pay?.status || b.paymentStatus,
      }));
    });

    res.json({
      success: true,
      movieTitle: schedule.movieId.title,
      showTime: `${schedule.startTime} - ${schedule.endTime}`,
      date: schedule.date,
      seatCategories: schedule.seatCategories,
      bookedSeats: seatDetails,
    });
  } catch (error) {
    console.error("Seat map fetch error:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch seat map" });
  }
};
/* -------------------------------------------------------------------------- */
/* 🧾 4. All Bookings (for Admin Table) */
/* -------------------------------------------------------------------------- */
export const getBookings = async (req, res) => {
  try {
    const bookings = await Booking.find()
      .populate("userId", "name email")
      .populate({
        path: "scheduleId",
        populate: { path: "movieId", select: "title" },
      })
      .sort({ createdAt: -1 });

    const formatted = bookings.map((b) => ({
      bookingId: b._id,
      user: b.userId?.name || "Unknown",
      email: b.userId?.email,
      movie: b.scheduleId?.movieId?.title || "Deleted Movie",
      date: b.scheduleId?.date,
      startTime: b.scheduleId?.startTime,
      endTime: b.scheduleId?.endTime,
      category: b.category,
      seats: b.seats,
      amount: b.amountPaid,
      bookingStatus: b.bookingStatus,
      paymentStatus: b.paymentStatus,
    }));

    res.json({ success: true, bookings: formatted });
  } catch (error) {
    console.error("Booking fetch error:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch bookings" });
  }
};

/* -------------------------------------------------------------------------- */
/* 💳 5. All Payments (for Admin Table) */
/* -------------------------------------------------------------------------- */
export const getPayments = async (req, res) => {
  try {
    const payments = await Payment.find()
      .populate("userId", "name email")
      .populate({
        path: "bookingId",
        populate: {
          path: "scheduleId",
          populate: { path: "movieId", select: "title" },
        },
      })
      .sort({ createdAt: -1 });

    const formatted = payments.map((p) => ({
      transactionId: p.transactionId,
      provider: p.provider,
      amount: p.amount,
      status: p.status,
      user: p.userId?.name || "Unknown",
      movie: p.bookingId?.scheduleId?.movieId?.title || "Deleted Movie",
      bookingId: p.bookingId?._id,
      date: p.createdAt,
    }));

    res.json({ success: true, payments: formatted });
  } catch (error) {
    console.error("Payment fetch error:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch payments" });
  }
};

/* -------------------------------------------------------------------------- */
/* 👤 6. Users Summary */
/* -------------------------------------------------------------------------- */
export const getUsers = async (req, res) => {
  try {
    const users = await User.aggregate([
      {
        $lookup: {
          from: "bookings",
          localField: "_id",
          foreignField: "userId",
          as: "bookings",
        },
      },
      {
        $addFields: {
          totalBookings: { $size: "$bookings" },
          totalAmountSpent: {
            $sum: {
              $map: {
                input: {
                  $filter: {
                    input: "$bookings",
                    as: "b",
                    cond: { $eq: ["$$b.bookingStatus", "confirmed"] },
                  },
                },
                as: "b",
                in: "$$b.amountPaid",
              },
            },
          },
        },
      },
      {
        $project: {
          _id: 0,
          userId: "$_id",
          name: 1,
          email: 1,
          role: 1,
          totalBookings: 1,
          totalAmountSpent: 1,
        },
      },
      { $sort: { totalBookings: -1 } },
    ]);

    res.json({ success: true, users });
  } catch (error) {
    console.error("User summary error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch users" });
  }
};

/* -------------------------------------------------------------------------- */
/* 🎛️ 7. Toggle Movie Booking Status */
/* -------------------------------------------------------------------------- */
export const toggleMovieBookingStatus = async (req, res) => {
  try {
    const movie = await Movie.findById(req.params.id);
    if (!movie)
      return res
        .status(404)
        .json({ success: false, message: "Movie not found" });

    movie.bookingStatus = movie.bookingStatus === "open" ? "closed" : "open";
    await movie.save();

    res.json({
      success: true,
      message: `Booking ${
        movie.bookingStatus === "open" ? "opened" : "closed"
      } for ${movie.title}`,
      movie,
    });
  } catch (error) {
    console.error("Toggle booking status error:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to update movie status" });
  }
};
