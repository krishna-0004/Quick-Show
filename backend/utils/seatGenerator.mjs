// utils/seatGenerator.mjs
export const generateSeats = (rows, cols) => {
  const seats = [];
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

  for (let r = 0; r < rows; r++) {
    const rowLetter = alphabet[r]; // A, B, C ...
    for (let c = 1; c <= cols; c++) {
      seats.push({
        seatNumber: `${rowLetter}${c}`,
        isBooked: false,
      });
    }
  }

  return seats;
};
