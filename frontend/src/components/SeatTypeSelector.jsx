import React from "react";
import "../style/SeatTypeSelector.css";

const SeatTypeSelector = ({ seatCategories, selectedCategory, onSelect }) => {
  return (
    <div className="seat-type-selector">
      {seatCategories.map((cat) => {
        const isActive = selectedCategory === cat.type;
        const hasSeats = cat.availableSeats > 0;

        return (
          <button
            key={cat.type}
            className={`seat-type-btn ${isActive ? "active" : ""} ${!hasSeats ? "disabled" : ""}`}
            onClick={() => hasSeats && onSelect(cat.type)}
            disabled={!hasSeats}
          >
            {cat.type.charAt(0).toUpperCase() + cat.type.slice(1)} - ₹{cat.price}{" "}
            {!hasSeats ? "(Sold Out)" : `(${cat.availableSeats} seats)`}
          </button>
        );
      })}
    </div>
  );
};

export default SeatTypeSelector;
