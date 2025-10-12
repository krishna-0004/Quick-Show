// src/pages/Admin/Show.jsx
import React, { useEffect, useState } from "react";
import { api } from "../../utils/axios";
import ScheduleForm from "../../components/Admin/ScheduleForm";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "../../style/MovieForm.css";
import { useAuth } from "../../context/AuthContext";
import Loader from "../../components/Loader";
import { formatTo12Hour } from "../../utils/time";

const Show = () => {
  const { user, loading: authLoading, isAdmin } = useAuth();

  const [schedules, setSchedules] = useState([]);
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editSchedule, setEditSchedule] = useState(null);

  // Fetch schedules
  const fetchSchedules = async () => {
    try {
      const res = await api.get("/show");
      if (res.data.success) setSchedules(res.data.schedules);
    } catch (err) {
      toast.error("Failed to load schedules");
    } finally {
      setLoading(false);
    }
  };

  // Fetch movies for dropdown
  const fetchMovies = async () => {
    try {
      const res = await api.get("/movie");
      if (res.data.success) setMovies(res.data.movies);
    } catch (err) {
      toast.error("Failed to load movies");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this schedule?")) return;
    try {
      await api.delete(`/show/${id}`);
      toast.success("Schedule deleted successfully");
      fetchSchedules();
    } catch {
      toast.error("Failed to delete schedule");
    }
  };

  const handleEdit = (schedule) => {
    setEditSchedule(schedule);
    setShowForm(true);
  };

  useEffect(() => {
    if (isAdmin()) {
      fetchMovies();
      fetchSchedules();
    }
  }, [user]);

  // 🔹 Wait for auth check
  if (authLoading) return <Loader />;

  // 🔹 Block non-admins
  if (!isAdmin()) {
    return (
      <div className="movie-admin">
        <h2>🚫 Access Denied</h2>
        <p>You are not authorized to manage schedules.</p>
      </div>
    );
  }

  return (
    <div className="movie-admin">
      <ToastContainer />
      <div className="header">
        <h2>🕒 Manage Show Schedules</h2>
        <button
          onClick={() => {
            setEditSchedule(null);
            setShowForm(true);
          }}
          className="btn-primary"
        >
          ➕ Add Schedule
        </button>
      </div>

      {loading ? (
        <Loader />
      ) : schedules.length === 0 ? (
        <p className="no-data">No schedules found</p>
      ) : (
        <table className="movie-table">
          <thead>
            <tr>
              <th>Movie</th>
              <th>Date</th>
              <th>Start Time</th>
              <th>End Time</th>
              <th>Seats</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {schedules.map((s) => (
              <tr key={s._id}>
                <td>{s.movieId?.title}</td>
                <td>{new Date(s.date).toLocaleDateString()}</td>
                <td>{formatTo12Hour(s.startTime)}</td>
                <td>{formatTo12Hour(s.endTime)}</td>
                <td>
                  {s.seatCategories
                    .map((c) => `${c.type}: ${c.totalSeats}`)
                    .join(", ")}
                </td>
                <td>
                  <button onClick={() => handleEdit(s)} className="btn-edit">
                    ✏️ Edit
                  </button>
                  <button
                    onClick={() => handleDelete(s._id)}
                    className="btn-delete"
                  >
                    🗑️ Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {showForm && (
        <ScheduleForm
          schedule={editSchedule}
          movies={movies}
          onClose={() => setShowForm(false)}
          onSuccess={() => {
            setShowForm(false);
            fetchSchedules();
          }}
        />
      )}
    </div>
  );
};

export default Show;
