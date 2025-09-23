import React, { useEffect, useState } from "react";
import { api } from "../../utils/axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "../../style/MovieForm.css";
import { useAuth } from "../../context/AuthContext";
import Loader from "../../components/Loader";

const ShowAdmin = () => {
  const { user, loading: authLoading, isAdmin } = useAuth();

  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showSeatMap, setShowSeatMap] = useState(false);
  const [seatMapData, setSeatMapData] = useState(null);

  // Fetch admin summary
  const fetchSchedules = async () => {
    try {
      const res = await api.get("/show/admin/summary");
      if (res.data.success) setSchedules(res.data.summary);
    } catch (err) {
      toast.error("Failed to fetch schedules");
    } finally {
      setLoading(false);
    }
  };

  const handleViewSeatMap = async (scheduleId) => {
    try {
      const res = await api.get(`/show/admin/${scheduleId}/seats`);
      if (res.data.success) {
        setSeatMapData(res.data.schedule);
        setShowSeatMap(true);
      }
    } catch {
      toast.error("Failed to fetch seat map");
    }
  };

  useEffect(() => {
    if (isAdmin()) fetchSchedules();
  }, [user]);

  if (authLoading) return <Loader />;

  if (!isAdmin()) {
    return (
      <div className="movie-admin">
        <h2>🚫 Access Denied</h2>
        <p>You are not authorized to view schedules.</p>
      </div>
    );
  }

  // Helper: group seats by row and sort
  const groupSeatsByRow = (seats) => {
    const rows = seats.reduce((acc, seat) => {
      const rowLetter = seat.seatNumber.match(/[A-Z]+/)[0];
      if (!acc[rowLetter]) acc[rowLetter] = [];
      acc[rowLetter].push(seat);
      return acc;
    }, {});
    return Object.keys(rows)
      .sort()
      .map((row) => ({ row, seats: rows[row] }));
  };

  // Helper: tooltip position for edge seats
  const getTooltipPosition = (idx, rowLength) => {
    if (idx < 2) return "right";
    if (idx >= rowLength - 2) return "left";
    return "top";
  };

  return (
    <div className="movie-admin">
      <ToastContainer />
      <div className="header">
        <h2>🕒 Manage Show Schedules</h2>
      </div>

      {loading ? (
        <p>Loading schedules...</p>
      ) : schedules.length === 0 ? (
        <p className="no-data">No schedules found</p>
      ) : (
        <table className="movie-table">
          <thead>
            <tr>
              <th>Movie</th>
              <th>Date</th>
              <th>Start</th>
              <th>End</th>
              <th>Category Summary</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {schedules.map((s) => (
              <tr key={s.scheduleId}>
                <td>{s.movieTitle}</td>
                <td>{new Date(s.date).toLocaleDateString()}</td>
                <td>{s.startTime}</td>
                <td>{s.endTime}</td>
                <td>
                  {s.categorySummary
                    .map(
                      (c) =>
                        `${c.type}: ${c.bookedSeats}/${c.totalSeats} (₹${c.totalAmount})`
                    )
                    .join(", ")}
                </td>
                <td>
                  <button
                    onClick={() => handleViewSeatMap(s.scheduleId)}
                    className="btn-primary"
                  >
                    🎟️ View Seats
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* Seat Map Modal */}
      {showSeatMap && seatMapData && (
        <div className="modal" onClick={() => setShowSeatMap(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Seat Map - {seatMapData.movieTitle}</h3>
            <p>
              {new Date(seatMapData.date).toLocaleDateString()} (
              {seatMapData.startTime} - {seatMapData.endTime})
            </p>

            {seatMapData.seatMap.map((cat) => (
              <div key={cat.type} style={{ marginBottom: "20px" }}>
                <h4>
                  {cat.type} - ₹{cat.price}
                </h4>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: "10px",
                  }}
                >
                  {groupSeatsByRow(cat.seats).map(({ seats }) => (
                    <div
                      key={seats[0].seatNumber}
                      style={{ display: "flex", gap: "6px" }}
                    >
                      {seats.map((seat, idx) => {
                        const tooltipPos = getTooltipPosition(idx, seats.length);
                        return (
                          <div
                            key={seat.seatNumber}
                            className={`seat ${
                              seat.isBooked ? "seat-booked" : ""
                            }`}
                            style={{ position: "relative" }}
                          >
                            {seat.seatNumber}

                            {seat.isBooked && (
                              <div
                                className="seat-tooltip"
                                data-position={tooltipPos}
                              >
                                <p>
                                  <strong>Booking ID:</strong>{" "}
                                  {seat.booking.bookingId}
                                </p>
                                <p>
                                  <strong>Payment ID:</strong>{" "}
                                  {seat.booking.paymentId}
                                </p>
                                <p>
                                  <strong>User:</strong> {seat.booking.user.name}
                                </p>
                                <p>
                                  <strong>Amount:</strong> ₹
                                  {seat.booking.amountPaid}
                                </p>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
            ))}

            <div className="form-actions">
              <button
                className="btn-cancel"
                onClick={() => setShowSeatMap(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ShowAdmin;
