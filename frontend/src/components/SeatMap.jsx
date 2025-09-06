import React from "react";
import "../style/SeatMap.css";

const SeatMap = ({ seatCategories, selectedCategory }) => {
  if (!seatCategories || !selectedCategory) return null;

  const category = seatCategories.find((cat) => cat.type === selectedCategory);
  if (!category) return <p>No seats available.</p>;

  // Group seats by row
  const rows = category.seats.reduce((acc, seat) => {
    const rowLetter = seat.seatNumber.match(/[A-Z]+/)[0];
    if (!acc[rowLetter]) acc[rowLetter] = [];
    acc[rowLetter].push(seat);
    return acc;
  }, {});

  const sortedRows = Object.keys(rows).sort();

  return (
    <div className="seat-map-container">
      <div className="screen">SCREEN</div>

      {/* ✅ One unified scroll container */}
      <div className="seat-map">
        {sortedRows.map((row) => (
          <div key={row} className="seat-row">
            <div className="row-label">{row}</div>
            {rows[row].map((seat) => (
              <button
                key={seat.seatNumber}
                className={`seat-btn ${seat.isBooked ? "booked" : ""}`}
              >
                {seat.seatNumber.replace(/[A-Z]+/, "")}
              </button>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

export default SeatMap;
