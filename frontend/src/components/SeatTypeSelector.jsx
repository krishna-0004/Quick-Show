// src/components/SeatTypeSelector.jsx
import React from "react";
import "../style/SeatTypeSelector.css";

const SeatTypeSelector = ({ seatCategories, selectedCategory, onSelect }) => {
  return (
    <div className="seat-type-selector">
      {seatCategories.map((cat) => (
        <button
          key={cat.type}
          className={`seat-type-btn ${
            selectedCategory === cat.type ? "active" : ""
          }`}
          onClick={() => onSelect(cat.type)}
        >
          {cat.type.charAt(0).toUpperCase() + cat.type.slice(1)} - ₹{cat.price}
        </button>
      ))}
    </div>
  );
};

export default SeatTypeSelector;
