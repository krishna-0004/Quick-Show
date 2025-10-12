// src/pages/Admin/AdminDashboard.jsx
import React, { useEffect, useState } from "react";
import { api } from "../../utils/axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useAuth } from "../../context/AuthContext";
import Loader from "../../components/Loader";
import "../PagesStyle/AdminDashboard.css";
import { LineChart, Line, ResponsiveContainer } from "recharts";
import { formatTo12Hour } from "../../utils/time";

const AdminDashboard = () => {
  const { user, loading: authLoading, isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState("summary");

  // Data states
  const [summary, setSummary] = useState(null);
  const [schedules, setSchedules] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [payments, setPayments] = useState([]);
  const [users, setUsers] = useState([]);

  // Loading states
  const [loadingSummary, setLoadingSummary] = useState(true);
  const [loadingSchedules, setLoadingSchedules] = useState(true);
  const [loadingBookings, setLoadingBookings] = useState(true);
  const [loadingPayments, setLoadingPayments] = useState(true);
  const [loadingUsers, setLoadingUsers] = useState(true);

  // Modal states
  const [seatMapModal, setSeatMapModal] = useState(null);
  const [loadingSeatMap, setLoadingSeatMap] = useState(false);

  const chartData = [
    { day: "Mon", value: Math.random() * 100 },
    { day: "Tue", value: Math.random() * 100 },
    { day: "Wed", value: Math.random() * 100 },
    { day: "Thu", value: Math.random() * 100 },
    { day: "Fri", value: Math.random() * 100 },
    { day: "Sat", value: Math.random() * 100 },
    { day: "Sun", value: Math.random() * 100 },
  ];

  // API Calls
  const fetchSummary = async () => {
    try {
      const res = await api.get("/admin/summary");
      if (res.data.success) setSummary(res.data.summary);
    } catch {
      toast.error("Failed to load summary");
    } finally {
      setLoadingSummary(false);
    }
  };

  const fetchSchedules = async () => {
    try {
      const res = await api.get("/admin/schedules");
      if (res.data.success) setSchedules(res.data.schedules);
    } catch {
      toast.error("Failed to load schedules");
    } finally {
      setLoadingSchedules(false);
    }
  };

  const fetchBookings = async () => {
    try {
      const res = await api.get("/admin/bookings");
      if (res.data.success) setBookings(res.data.bookings);
    } catch {
      toast.error("Failed to load bookings");
    } finally {
      setLoadingBookings(false);
    }
  };

  const fetchPayments = async () => {
    try {
      const res = await api.get("/admin/payments");
      if (res.data.success) setPayments(res.data.payments);
    } catch {
      toast.error("Failed to load payments");
    } finally {
      setLoadingPayments(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await api.get("/admin/users");
      if (res.data.success) setUsers(res.data.users);
    } catch {
      toast.error("Failed to load users");
    } finally {
      setLoadingUsers(false);
    }
  };

  const fetchSeatMapDetails = async (scheduleId) => {
    try {
      setLoadingSeatMap(true);
      const res = await api.get(`/admin/schedules/${scheduleId}/seats`);
      if (res.data.success) {
        setSeatMapModal(res.data);
      } else {
        toast.error("Failed to fetch seat map");
      }
    } catch {
      toast.error("Failed to load seat map");
    } finally {
      setLoadingSeatMap(false);
    }
  };

  useEffect(() => {
    if (isAdmin()) {
      fetchSummary();
      fetchSchedules();
      fetchBookings();
      fetchPayments();
      fetchUsers();
    }
  }, [user]);

  if (authLoading) return <Loader />;

  if (!isAdmin()) {
    return (
      <div className="movie-admin">
        <h2>🚫 Access Denied</h2>
        <p>You are not authorized to access the admin dashboard.</p>
      </div>
    );
  }

  return (
    <div className="movie-admin">
      <ToastContainer />
      <div className="header">
        <h2>📊 Admin Dashboard</h2>
        <p>Welcome, {user?.name || "Admin"}!</p>
      </div>

      {/* Tabs */}
      <div className="dashboard-tabs">
        {["summary", "schedules", "bookings", "payments", "users"].map(
          (tab) => (
            <button
              key={tab}
              className={`tab-btn ${activeTab === tab ? "active" : ""}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          )
        )}
      </div>

      {/* Tab Content */}
      <div className="tab-content">
        {/* SUMMARY TAB */}
        {activeTab === "summary" &&
          (loadingSummary ? (
            <Loader />
          ) : (
            <div className="dashboard-grid">
              {[
                { title: "🎥 Total Movies", value: summary?.totalMovies ?? 0 },
                { title: "🕒 Total Shows", value: summary?.totalShows ?? 0 },
                { title: "👥 Total Users", value: summary?.totalUsers ?? 0 },
                {
                  title: "🎟️ Total Bookings",
                  value: summary?.totalBookings ?? 0,
                },
                {
                  title: "💺 Seats Booked",
                  value: summary?.totalSeatsBooked ?? 0,
                },
                {
                  title: "💰 Total Revenue",
                  value: summary?.totalRevenue ?? 0,
                  prefix: "₹",
                },
              ].map((item, i) => (
                <div className="dashboard-card" key={i}>
                  <h3>{item.title}</h3>
                  <p>
                    {item.prefix ?? ""}
                    {item.value.toLocaleString()}
                  </p>
                  <div className="chart-wrapper">
                    <ResponsiveContainer width="100%" height={50}>
                      <LineChart data={chartData}>
                        <Line
                          type="monotone"
                          dataKey="value"
                          stroke="#007bff"
                          strokeWidth={2}
                          dot={false}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              ))}
            </div>
          ))}

        {/* SCHEDULES TAB */}
        {activeTab === "schedules" &&
          (loadingSchedules ? (
            <Loader />
          ) : (
            <div className="table-wrapper">
              <table className="movie-table">
                <thead>
                  <tr>
                    <th>Movie</th>
                    <th>Date</th>
                    <th>Start</th>
                    <th>End</th>
                    <th>Total Seats</th>
                    <th>Booked</th>
                    <th>Revenue</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {schedules.map((s) => (
                    <tr key={s._id}>
                      <td>{s.movieTitle}</td>
                      <td>{new Date(s.date).toLocaleDateString()}</td>
                      <td>{formatTo12Hour(s.startTime)}</td>
                      <td>{formatTo12Hour(s.endTime)}</td>
                      <td>{s.totalSeats}</td>
                      <td>{s.bookedSeats}</td>
                      <td>₹{s.totalRevenue.toLocaleString()}</td>
                      <td>
                        <button
                          className="action-btn view-btn"
                          onClick={() => fetchSeatMapDetails(s._id)}
                        >
                          View Seats
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}

        {/* BOOKINGS TAB */}
        {activeTab === "bookings" &&
          (loadingBookings ? (
            <Loader />
          ) : (
            <div className="table-wrapper">
              <table className="movie-table">
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Email</th>
                    <th>Movie</th>
                    <th>Date</th>
                    <th>Time</th>
                    <th>Seats</th>
                    <th>Category</th>
                    <th>Amount</th>
                    <th>Booking</th>
                    <th>Payment</th>
                  </tr>
                </thead>
                <tbody>
                  {bookings.map((b) => (
                    <tr key={b.bookingId}>
                      <td>{b.user}</td>
                      <td>{b.email}</td>
                      <td>{b.movie}</td>
                      <td>{new Date(b.date).toLocaleDateString()}</td>
                      <td>
                        {formatTo12Hour(b.startTime)} -{" "}
                        {formatTo12Hour(b.endTime)}
                      </td>

                      <td>{b.seats.join(", ")}</td>
                      <td>{b.category}</td>
                      <td>₹{b.amount.toLocaleString()}</td>
                      <td>{b.bookingStatus}</td>
                      <td>{b.paymentStatus}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}

        {/* PAYMENTS TAB */}
        {activeTab === "payments" &&
          (loadingPayments ? (
            <Loader />
          ) : (
            <div className="table-wrapper">
              <table className="movie-table">
                <thead>
                  <tr>
                    <th>Txn ID</th>
                    <th>User</th>
                    <th>Movie</th>
                    <th>Booking ID</th>
                    <th>Amount</th>
                    <th>Provider</th>
                    <th>Status</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((p) => (
                    <tr key={p.transactionId}>
                      <td>{p.transactionId}</td>
                      <td>{p.user}</td>
                      <td>{p.movie}</td>
                      <td>{p.bookingId}</td>
                      <td>₹{p.amount.toLocaleString()}</td>
                      <td>{p.provider}</td>
                      <td>{p.status}</td>
                      <td>{new Date(p.date).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}

        {/* USERS TAB */}
        {activeTab === "users" &&
          (loadingUsers ? (
            <Loader />
          ) : (
            <div className="table-wrapper">
              <table className="movie-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Total Bookings</th>
                    <th>Total Spent</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.userId}>
                      <td>{u.name}</td>
                      <td>{u.email}</td>
                      <td>{u.role}</td>
                      <td>{u.totalBookings}</td>
                      <td>₹{u.totalAmountSpent.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
      </div>

      {/* SEAT MAP MODAL */}
      {seatMapModal && (
        <div className="modal-overlay" onClick={() => setSeatMapModal(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>🎞 {seatMapModal.movieTitle}</h3>
            <p>
              {seatMapModal.date} | {formatTo12Hour(seatMapModal.showTime)}
            </p>
            {loadingSeatMap ? (
              <Loader />
            ) : (
              <div className="seatmap-info">
                <table className="movie-table">
                  <thead>
                    <tr>
                      <th>Seat</th>
                      <th>User</th>
                      <th>Email</th>
                      <th>Payment</th>
                      <th>Amount</th>
                      <th>Category</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {seatMapModal.bookedSeats.map((seat, i) => (
                      <tr key={i}>
                        <td>{seat.seatNumber}</td>
                        <td>{seat.userName}</td>
                        <td>{seat.email}</td>
                        <td>{seat.paymentId}</td>
                        <td>₹{seat.amountPaid}</td>
                        <td>{seat.category}</td>
                        <td>{seat.status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <button className="close-btn" onClick={() => setSeatMapModal(null)}>
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
