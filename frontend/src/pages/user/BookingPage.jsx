// src/components/Booking/BookingPage.jsx
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

  // ✅ Scroll to top on mount
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  // Fetch movie details
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
  useEffect(() => {
    const fetchSchedules = async () => {
      try {
        const { data } = await api.get("/show", { params: { movieId } });
        if (data.success) setSchedules(data.schedules);
      } catch (err) {
        console.error(err);
      }
    };
    fetchSchedules();
  }, [movieId]);

  // Aggregate seat categories (unique types with price)
  const seatCategories = useMemo(() => {
    const allCategories = schedules.flatMap((s) => s.seatCategories);
    const uniqueCategories = Array.from(
      new Map(
        allCategories.map((c) => [c.type, { type: c.type, price: c.price }])
      ).values()
    );
    return uniqueCategories;
  }, [schedules]);

  // Unique dates from all schedules
  const availableDates = useMemo(() => {
    const dates = schedules.map((s) =>
      new Date(s.date).toISOString().slice(0, 10)
    );
    return [...new Set(dates)].sort();
  }, [schedules]);

  // Update available times when a date is selected
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

  // Update seat map when a time or category is selected
  useEffect(() => {
    if (!selectedTime) return;

    const schedule = schedules.find((s) => s._id === selectedTime);
    if (schedule) {
      setSeatMap(schedule.seatCategories); // store all categories

      // If no category selected yet, default to first
      if (!selectedCategory && schedule.seatCategories.length > 0) {
        setSelectedCategory(schedule.seatCategories[0].type);
      }
    }
  }, [selectedTime, schedules, selectedCategory]);

  if (loading) return <Loader />;

  return (
    <div className="booking-page">
      {/* Step 1: Seat Type */}
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

      {/* Step 2: Date */}
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

      {/* Step 3: Time */}
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

      {/* Step 4: Seat Map & Movie Details */}
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
          />
        </div>
      )}
    </div>
  );
};

export default BookingPage;
