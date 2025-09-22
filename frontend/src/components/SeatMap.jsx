import React from "react";
import "../style/SeatMap.css";

const SeatMap = ({ seatCategories, selectedCategory, selectedSeats = [], onSeatClick }) => {
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
      <div className="seat-map">
        {sortedRows.map((row) => (
          <div key={row} className="seat-row">
            <div className="row-label">{row}</div>
            {rows[row].map((seat) => {
              const isSelected = selectedSeats.includes(seat.seatNumber);
              const seatClass = seat.isBooked
                ? "booked"
                : isSelected
                ? "selected"
                : "available";
              return (
                <button
                  key={seat.seatNumber}
                  className={`seat-btn ${seatClass}`}
                  onClick={() =>
                    !seat.isBooked && onSeatClick && onSeatClick(seat.seatNumber)
                  }
                  disabled={seat.isBooked}
                >
                  {seat.seatNumber.replace(/[A-Z]+/, "")}
                </button>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
};

export default SeatMap;
