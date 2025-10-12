import React, { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "../../utils/axios";
import "../PagesStyle/BookingPage.css";

import SeatTypeSelector from "../../components/SeatTypeSelector";
import SeatMap from "../../components/SeatMap";
import MovieDetails from "../../components/MovieDetails";
import { DateSelector, TimeSelector } from "../../components/DateTimeSelector";
import Loader from "../../components/Loader";
import { useAuth } from "../../context/AuthContext";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const BookingPage = () => {
  const { movieId } = useParams();
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  const [movie, setMovie] = useState(null);
  const [schedules, setSchedules] = useState([]);
  const [loadingMovie, setLoadingMovie] = useState(true);

  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [availableTimes, setAvailableTimes] = useState([]);
  const [selectedTime, setSelectedTime] = useState(null);
  const [seatMap, setSeatMap] = useState(null);

  const [selectedSeats, setSelectedSeats] = useState([]);
  const [bookingLock, setBookingLock] = useState(null);
  const [lockCountdown, setLockCountdown] = useState(0);
  const [paymentStatus, setPaymentStatus] = useState("idle");

  // Scroll to top
  useEffect(() => window.scrollTo({ top: 0, behavior: "smooth" }), []);

  // Fetch movie
  useEffect(() => {
    const fetchMovie = async () => {
      try {
        setLoadingMovie(true);
        const { data } = await api.get(`/movie/${movieId}`);
        if (data.success) setMovie(data.movie);
      } catch (err) {
        console.error(err);
        toast.error("Failed to load movie details.");
      } finally {
        setLoadingMovie(false);
      }
    };
    fetchMovie();
  }, [movieId]);

  // Fetch schedules
  const fetchSchedules = async (updateSeatMap = false) => {
    try {
      const { data } = await api.get("/show", { params: { movieId } });
      if (data.success) {
        setSchedules(data.schedules);

        if (updateSeatMap && selectedTime) {
          const updated = data.schedules.find((s) => s._id === selectedTime);
          if (updated) setSeatMap(updated.seatCategories);
        }
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to load schedules.");
    }
  };

  useEffect(() => {
    fetchSchedules();
  }, [movieId]);

  // Seat categories
  const seatCategories = useMemo(() => {
    const allCategories = schedules.flatMap((s) => s.seatCategories);
    const uniqueCategories = Array.from(
      new Map(
        allCategories.map((c) => [
          c.type,
          {
            type: c.type,
            price: c.price,
            availableSeats: c.seats.filter((s) => !s.isBooked).length,
          },
        ])
      ).values()
    );
    return uniqueCategories;
  }, [schedules]);

  // Dates
  const availableDates = useMemo(() => {
    const dates = schedules.map((s) =>
      new Date(s.date).toISOString().slice(0, 10)
    );
    return [...new Set(dates)].sort();
  }, [schedules]);

  // Times
  useEffect(() => {
    if (!selectedDate) return;
    const times = schedules
      .filter(
        (s) => new Date(s.date).toISOString().slice(0, 10) === selectedDate
      )
      .map((s) => ({
        _id: s._id,
        startTime: s.startTime,
        endTime: s.endTime,
        seatCategories: s.seatCategories,
      }));
    setAvailableTimes(times);
    setSelectedTime(null);
  }, [selectedDate, schedules]);

  // Update seat map
  useEffect(() => {
    if (!selectedTime) return;
    const schedule = schedules.find((s) => s._id === selectedTime);
    if (schedule) {
      setSeatMap(schedule.seatCategories);
      if (!selectedCategory && schedule.seatCategories.length > 0) {
        setSelectedCategory(schedule.seatCategories[0].type);
      }
    }
  }, [selectedTime, schedules, selectedCategory]);

  // Toggle seat
  const toggleSeat = (seatNumber) => {
    if (!seatMap) return;
    const category = seatMap.find((c) => c.type === selectedCategory);
    const seatObj = category.seats.find((s) => s.seatNumber === seatNumber);
    if (!seatObj || seatObj.isBooked) return;

    setSelectedSeats((prev) =>
      prev.includes(seatNumber)
        ? prev.filter((s) => s !== seatNumber)
        : [...prev, seatNumber]
    );
  };

  // Lock seats
  const lockSeatsHandler = async () => {
    if (!user) {
      toast.warning("⚠️ Please login first to lock seats.");
      return;
    }
    if (selectedSeats.length === 0) {
      toast.info("Select at least 1 seat.");
      return;
    }

    try {
      const { data } = await api.post("/booking/lock", {
        scheduleId: selectedTime,
        category: selectedCategory,
        seats: selectedSeats,
      });

      setBookingLock({
        bookingId: data.bookingId,
        amountExpected: data.amountExpected,
        expiresAt: Date.now() + data.expiresInSec * 1000,
      });
      setLockCountdown(data.expiresInSec);
      toast.success("Seats locked! Complete payment within time limit.");
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.error || "Failed to lock seats.");
    }
  };

  // Countdown
  useEffect(() => {
    if (!bookingLock) return;
    if (lockCountdown <= 0) {
      setBookingLock(null);
      setSelectedSeats([]);
      return;
    }
    const timer = setTimeout(() => setLockCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [lockCountdown, bookingLock]);

  // Payment
  const payNow = async () => {
    if (!bookingLock) return;
    setPaymentStatus("pending");

    try {
      const { data } = await api.post("/payment/create-order", {
        bookingId: bookingLock.bookingId,
      });

      if (!window.Razorpay) {
        toast.error("Razorpay SDK failed to load.");
        setPaymentStatus("failed");
        return;
      }

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: data.order.amount,
        currency: data.order.currency,
        name: "Quick Show",
        order_id: data.order.id,
        handler: async function (response) {
          try {
            await api.post("/payment/confirm", {
              bookingId: bookingLock.bookingId,
              paymentId: response.razorpay_payment_id,
            });

            setPaymentStatus("success");
            toast.success("✅ Payment successful! Redirecting to My Bookings...");
            navigate("/my-bookings");
          } catch (err) {
            console.error("Confirm booking failed:", err);
            setPaymentStatus("failed");
            toast.error(
              "Payment succeeded, but booking confirmation failed. Contact support."
            );
          }
        },
        theme: { color: "#ff9900" },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      console.error(err);
      setPaymentStatus("failed");
      toast.error("Payment failed. Try again.");
    }
  };

  if (loading || loadingMovie) return <Loader />;

  return (
    <div className="booking-page">
      <ToastContainer position="top-right" autoClose={3000} />

      {!selectedCategory && seatCategories.length > 0 && (
        <div className="step-card">
          <h2>Select Seat Type</h2>
          <SeatTypeSelector
            seatCategories={seatCategories}
            selectedCategory={selectedCategory}
            onSelect={setSelectedCategory}
          />
        </div>
      )}

      {selectedCategory && !selectedDate && (
        <div className="step-card">
          <h2>Select Date</h2>
          <DateSelector
            availableDates={availableDates}
            selectedDate={selectedDate}
            onSelect={setSelectedDate}
          />
        </div>
      )}

      {selectedCategory && selectedDate && !selectedTime && (
        <div className="step-card">
          <h2>Select Time</h2>
          <TimeSelector
            availableTimes={availableTimes}
            selectedTime={selectedTime}
            onSelect={setSelectedTime}
          />
        </div>
      )}

      {seatMap && selectedCategory && selectedDate && selectedTime && (
        <div className="booking-main">
          <MovieDetails
            movie={movie}
            selectedDate={selectedDate}
            selectedTime={
              availableTimes.find((t) => t._id === selectedTime)?.startTime
            }
          />

          <SeatMap
            seatCategories={seatMap}
            selectedCategory={selectedCategory}
            selectedSeats={selectedSeats}
            onSeatClick={toggleSeat}
          />

          <div className="booking-actions">
            {!bookingLock && selectedSeats.length > 0 && (
              <div className="summary-card">
                <h3>Booking Summary (Preview)</h3>
                <p>
                  <strong>Seats:</strong> {selectedSeats.join(", ")}
                </p>
                <p>
                  <strong>Category:</strong> {selectedCategory}
                </p>
                <p>
                  <strong>Date:</strong> {selectedDate}
                </p>
                <p>
                  <strong>Time:</strong>{" "}
                  {
                    availableTimes.find((t) => t._id === selectedTime)
                      ?.startTime
                  }
                </p>
                <p>
                  <strong>Total:</strong> ₹
                  {
                    seatCategories.find((c) => c.type === selectedCategory)
                      ?.price * selectedSeats.length
                  }
                </p>
              </div>
            )}

            {bookingLock ? (
              <>
                <div className="summary-card locked">
                  <h3>Booking Summary (Locked)</h3>
                  <p>
                    <strong>Seats:</strong> {selectedSeats.join(", ")}
                  </p>
                  <p>
                    <strong>Category:</strong> {selectedCategory}
                  </p>
                  <p>
                    <strong>Date:</strong> {selectedDate}
                  </p>
                  <p>
                    <strong>Time:</strong>{" "}
                    {
                      availableTimes.find((t) => t._id === selectedTime)
                        ?.startTime
                    }
                  </p>
                  <p>
                    <strong>Total:</strong> ₹{bookingLock.amountExpected}
                  </p>
                  <p className="countdown">Time remaining: {lockCountdown}s</p>
                </div>

                <button
                  className="pay-btn"
                  onClick={payNow}
                  disabled={paymentStatus === "pending"}
                >
                  {paymentStatus === "pending" ? "Processing..." : "Pay Now"}
                </button>
              </>
            ) : (
              <button
                className="lock-btn"
                onClick={lockSeatsHandler}
                disabled={selectedSeats.length === 0}
              >
                Lock Selected Seats
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default BookingPage;
