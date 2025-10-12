import React, { useEffect, useState } from "react";
import { api } from "../../utils/axios";
import "../PagesStyle/MyBookings.css";
import Loader from "../../components/Loader";
import { useAuth } from "../../context/AuthContext";

const MyBookings = () => {
  const { user, loading } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    const fetchBookings = async () => {
      if (!user) return;
      try {
        const { data } = await api.get("/booking/my");
        setBookings(data.bookings || []);
      } catch (err) {
        console.error("Error fetching bookings", err);
      } finally {
        setFetching(false);
      }
    };
    fetchBookings();
  }, [user]);

  const cancelBooking = async (id) => {
    try {
      const { data } = await api.post(`/booking/cancel/${id}`);
      alert(data.message);
      setBookings((prev) => prev.filter((b) => b._id !== id));
    } catch (err) {
      alert(err.response?.data?.message || "Error cancelling booking");
    }
  };

  if (loading || fetching) return <Loader />;

  if (!user) {
    return (
      <div className="cinematic-message">
        <h1>🎬 Access Denied</h1>
        <p>
          You must <span className="highlight">Login First</span> to view your
          bookings.
        </p>
        <p className="sub-text">
          Grab your popcorn 🍿 and sign in to continue!
        </p>
      </div>
    );
  }

  return (
    <div className="my-bookings">
      <h2>My Last 5 Bookings</h2>
      <div className="booking-list">
        {bookings.length === 0 ? (
          <p>No bookings found.</p>
        ) : (
          bookings.map((b) => {
            const schedule = b.scheduleId;
            if (!schedule) return null;

            // Convert backend-provided datetime to JS Date object
            const showTime = new Date(schedule.showDateTime);
            const diffHours = (showTime - new Date()) / (1000 * 60 * 60);

            return (
              <div key={b._id} className="booking-card">
                {/* Platform Name */}
                <h3>Quick Show</h3>

                {/* Movie Title */}
                <p className="movie-title">
                  {schedule.movieId?.title || "Untitled Movie"}
                </p>

                {/* Booking Details */}
                <p>
                  <strong>Date:</strong> {showTime.toLocaleDateString()}
                </p>
                <p>
                  <strong>Time:</strong>{" "}
                  {showTime.toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
                <p>
                  <strong>Seat Type:</strong> {b.category}
                </p>
                <p>
                  <strong>Seats:</strong> {b.seats.join(", ")}
                </p>
                <p>
                  <strong>Amount:</strong> ₹
                  {b.amountPaid || b.amountExpected || "N/A"}
                </p>
                <p>
                  <strong>Status:</strong> {b.bookingStatus}
                </p>

                <p className="note">
                  ⚠️ Cancellations are allowed only up to 4 hours before the
                  showtime. To cancel a ticket and receive a refund, please
                  visit the theater at least 4 hours before the movie starts.
                </p>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default MyBookings;
