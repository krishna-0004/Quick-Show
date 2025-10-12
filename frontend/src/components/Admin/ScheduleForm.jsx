import React, { useState } from "react";
import { api } from "../../utils/axios";
import { toast } from "react-toastify";
import "../../style/MovieForm.css";

const ScheduleForm = ({ schedule, movies, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    movieId: schedule?.movieId?._id || "",
    date: schedule?.date ? new Date(schedule.date).toISOString().slice(0, 10) : "",
    startTime: schedule?.startTime || "",
    endTime: schedule?.endTime || "",
    seatCategories: schedule?.seatCategories || [
      { type: "prime", price: 100, rows: 4, cols: 16 },
      { type: "classic", price: 80, rows: 10, cols: 10 },
    ],
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSeatChange = (index, field, value) => {
    const updated = [...form.seatCategories];
    updated[index][field] = value;
    setForm({ ...form, seatCategories: updated });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = {
        ...form,
        seatCategories: form.seatCategories.map((c) => ({
          ...c,
          rows: Number(c.rows),
          cols: Number(c.cols),
          price: Number(c.price),
        })),
      };

      if (schedule) {
        await api.put(`/show/${schedule._id}`, payload);
        toast.success("✅ Schedule updated successfully");
      } else {
        await api.post("/show", payload);
        toast.success("✅ Schedule created successfully");
      }
      onSuccess();
    } catch (err) {
      toast.error(err.response?.data?.message || "❌ Failed to save schedule");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal">
      <div className="modal-content responsive-form">
        <h3>{schedule ? "Edit Schedule" : "Add Schedule"}</h3>
        <form onSubmit={handleSubmit} className="schedule-form">
          
          {/* Movie Selection */}
          <div className="form-group">
            <label htmlFor="movieId">🎬 Select Movie</label>
            <select
              id="movieId"
              name="movieId"
              value={form.movieId}
              onChange={handleChange}
              required
            >
              <option value="">-- Choose a Movie --</option>
              {movies.map((m) => (
                <option key={m._id} value={m._id}>
                  {m.title}
                </option>
              ))}
            </select>
          </div>

          {/* Date */}
          <div className="form-group">
            <label htmlFor="date">📅 Date</label>
            <input
              type="date"
              id="date"
              name="date"
              value={form.date}
              onChange={handleChange}
              required
              placeholder="e.g., 2025-09-01"
            />
          </div>

          {/* Start Time */}
          <div className="form-group">
            <label htmlFor="startTime">⏰ Start Time</label>
            <input
              type="time"
              id="startTime"
              name="startTime"
              value={form.startTime}
              onChange={handleChange}
              required
              placeholder="e.g., 14:30"
            />
          </div>

          {/* End Time */}
          <div className="form-group">
            <label htmlFor="endTime">⏰ End Time</label>
            <input
              type="time"
              id="endTime"
              name="endTime"
              value={form.endTime}
              onChange={handleChange}
              required
              placeholder="e.g., 17:00"
            />
          </div>

          {/* Seat Categories */}
          <h4>💺 Seat Categories</h4>
          {form.seatCategories.map((cat, i) => (
            <div key={i} className="seat-category">
              <label>Category: {cat.type}</label>
              <div className="seat-inputs">
                <input
                  type="number"
                  value={cat.price}
                  onChange={(e) =>
                    handleSeatChange(i, "price", e.target.value)
                  }
                  placeholder="Price (e.g., 300)"
                />
                <input
                  type="number"
                  value={cat.rows}
                  onChange={(e) =>
                    handleSeatChange(i, "rows", e.target.value)
                  }
                  placeholder="Rows (e.g., 4)"
                />
                <input
                  type="number"
                  value={cat.cols}
                  onChange={(e) =>
                    handleSeatChange(i, "cols", e.target.value)
                  }
                  placeholder="Cols (e.g., 16)"
                />
              </div>
            </div>
          ))}

          {/* Actions */}
          <div className="form-actions">
            <button
              type="submit"
              className="btn-primary"
              disabled={loading}
            >
              {loading
                ? schedule
                  ? "Updating..."
                  : "Saving..."
                : schedule
                ? "Update"
                : "Add"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="btn-cancel"
              disabled={loading}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ScheduleForm;
