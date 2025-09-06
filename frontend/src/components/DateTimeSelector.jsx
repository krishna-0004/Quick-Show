// src/components/Booking/DateTimeSelector.jsx
import React from "react";
import "../style/DateTimeSelector.css";

export const DateSelector = ({ availableDates, selectedDate, onSelect }) => (
  <div className="date-selector">
    {availableDates.map((date) => (
      <button
        key={date}
        className={`date-btn ${selectedDate === date ? "active" : ""}`}
        onClick={() => onSelect(date)}
      >
        {date}
      </button>
    ))}
  </div>
);

export const TimeSelector = ({ availableTimes, selectedTime, onSelect }) => (
  <div className="time-selector">
    {availableTimes.map((time) => (
      <button
        key={time._id}
        className={`time-btn ${selectedTime === time._id ? "active" : ""}`}
        onClick={() => onSelect(time._id)}
      >
        {time.startTime} - {time.endTime}
      </button>
    ))}
  </div>
);
