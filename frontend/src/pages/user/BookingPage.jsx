import React, { useState, useEffect, useMemo } from "react";
import { useParams } from "react-router-dom";
import { api } from "../../utils/axios";
import "../PagesStyle/BookingPage.css";

import SeatTypeSelector from "../../components/SeatTypeSelector";
import SeatMap from "../../components/SeatMap";
import MovieDetails from "../../components/MovieDetails";
import { DateSelector, TimeSelector } from "../../components/DateTimeSelector";
import Loader from "../../components/Loader";

const BookingPage = () => {
  const { movieId } = useParams();

  const [movie, setMovie] = useState(null);
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);

  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [availableTimes, setAvailableTimes] = useState([]);
  const [selectedTime, setSelectedTime] = useState(null);
  const [seatMap, setSeatMap] = useState(null);

  const [selectedSeats, setSelectedSeats] = useState([]);
  const [bookingLock, setBookingLock] = useState(null);
  const [lockCountdown, setLockCountdown] = useState(0);
  const [paymentStatus, setPaymentStatus] = useState("idle"); // idle | pending | success | failed

  // Scroll to top
  useEffect(() => window.scrollTo({ top: 0, behavior: "smooth" }), []);

  // Fetch movie
  useEffect(() => {
    const fetchMovie = async () => {
      try {
        setLoading(true);
        const { data } = await api.get(`/movie/${movieId}`);
        if (data.success) setMovie(data.movie);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchMovie();
  }, [movieId]);

  // Fetch schedules
  // Fetch schedules
  const fetchSchedules = async (updateSeatMap = false) => {
    try {
      const { data } = await api.get("/show", { params: { movieId } });
      if (data.success) {
        setSchedules(data.schedules);

        // 👇 force update seatMap immediately if needed
        if (updateSeatMap && selectedTime) {
          const updated = data.schedules.find((s) => s._id === selectedTime);
          if (updated) setSeatMap(updated.seatCategories);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };


  useEffect(() => {
    fetchSchedules();
  }, [movieId]);

  // Seat categories for selector
  const seatCategories = useMemo(() => {
    const allCategories = schedules.flatMap((s) => s.seatCategories);
    const uniqueCategories = Array.from(
      new Map(
        allCategories.map((c) => [
          c.type,
          { type: c.type, price: c.price, availableSeats: c.seats.filter(s => !s.isBooked).length }
        ])
      ).values()
    );
    return uniqueCategories;
  }, [schedules]);

  // Dates
  const availableDates = useMemo(() => {
    const dates = schedules.map((s) => new Date(s.date).toISOString().slice(0, 10));
    return [...new Set(dates)].sort();
  }, [schedules]);

  // Times for selected date
  useEffect(() => {
    if (!selectedDate) return;
    const times = schedules
      .filter((s) => new Date(s.date).toISOString().slice(0, 10) === selectedDate)
      .map((s) => ({
        _id: s._id,
        startTime: s.startTime,
        endTime: s.endTime,
        seatCategories: s.seatCategories,
      }));
    setAvailableTimes(times);
    setSelectedTime(null);
  }, [selectedDate, schedules]);

  // Update seat map when time or schedules change
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

  // Toggle seat selection
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
    if (selectedSeats.length === 0) return alert("Select at least 1 seat.");

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
      alert("Seats locked! Complete payment within time limit.");
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.error || "Failed to lock seats.");
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

  // Handle payment
  const payNow = async () => {
    if (!bookingLock) return;
    setPaymentStatus("pending");

    try {
      // 1️⃣ Create Razorpay order on server
      const { data } = await api.post("/payment/create-order", {
        bookingId: bookingLock.bookingId,
      });

      if (!window.Razorpay) {
        alert("Razorpay SDK failed to load.");
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
            // 2️⃣ Confirm booking on backend
            await api.post("/payment/confirm", {
              bookingId: bookingLock.bookingId,
              paymentId: response.razorpay_payment_id,
            });

            setPaymentStatus("success");
            alert("Payment successful! Booking confirmed.");

            // 3️⃣ Refresh schedule to reflect booked seats
            await fetchSchedules(true);

            // Reset selection
            setSelectedSeats([]);
            setBookingLock(null);
          } catch (err) {
            console.error("Confirm booking failed:", err);
            setPaymentStatus("failed");
            alert(
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
      alert("Payment failed. Try again.");
    }
  };

  if (loading) return <Loader />;

  return (
    <div className="booking-page">
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
            {bookingLock ? (
              <>
                <p>Seats locked! Time remaining: {lockCountdown}s</p>
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
