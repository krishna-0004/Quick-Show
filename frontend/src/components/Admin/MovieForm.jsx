import React, { useState } from "react";
import { api } from "../../utils/axios";
import { toast } from "react-toastify";
import "../../style/MovieForm.css";

const MovieForm = ({ movie, onClose, onSuccess }) => {
  const [form, setForm] = useState({
    title: movie?.title || "",
    description: movie?.description || "",
    language: movie?.language || "",
    genre: Array.isArray(movie?.genre)
      ? movie.genre.join(", ")
      : movie?.genre || "",
    duration: movie?.duration || "",
    releaseDate: movie?.releaseDate ? movie.releaseDate.split("T")[0] : "",
    trailerUrl: movie?.trailerUrl || "",
    posterUrl: movie?.poster?.url || "",
    status: movie?.status || "coming_soon",
  });

  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false); // ✅ new state

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);
    formData.append(
      "upload_preset",
      import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET
    );

    try {
      setUploading(true);
      const res = await fetch(
        `https://api.cloudinary.com/v1_1/${
          import.meta.env.VITE_CLOUDINARY_CLOUD_NAME
        }/image/upload`,
        {
          method: "POST",
          body: formData,
        }
      );

      const data = await res.json();
      if (data.secure_url) {
        setForm({ ...form, posterUrl: data.secure_url });
        toast.success("Poster uploaded successfully!");
      } else {
        throw new Error("Invalid Cloudinary response");
      }
    } catch (err) {
      toast.error("Failed to upload poster");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true); // ✅ disable button immediately

    const payload = {
      ...form,
      genre: form.genre
        .split(",")
        .map((g) => g.trim())
        .filter((g) => g.length > 0),
    };

    try {
      if (movie) {
        await api.put(`/movie/${movie._id}`, payload);
        toast.success("Movie updated successfully");
      } else {
        await api.post("/movie", payload);
        toast.success("Movie added successfully");
      }
      onSuccess();
    } catch (err) {
      toast.error("Failed to save movie");
    } finally {
      setSubmitting(false); // ✅ re-enable after API
    }
  };

  return (
    <div className="modal">
      <div className="modal-content">
        <h3>{movie ? "Edit Movie" : "Add Movie"}</h3>
        <form onSubmit={handleSubmit}>
          {/* Title */}
          <label>Movie Title</label>
          <input
            type="text"
            name="title"
            value={form.title}
            onChange={handleChange}
            placeholder="e.g. 3 Idiots"
            required
          />

          {/* Description */}
          <label>Description</label>
          <textarea
            name="description"
            value={form.description}
            onChange={handleChange}
            placeholder="e.g. A story of three engineering students navigating life, friendship, and pressure."
            rows={3}
          />

          {/* Language */}
          <label>Language</label>
          <input
            type="text"
            name="language"
            value={form.language}
            onChange={handleChange}
            placeholder="e.g. Hindi"
          />

          {/* Genre */}
          <label>Genre</label>
          <input
            type="text"
            name="genre"
            value={form.genre}
            onChange={handleChange}
            placeholder="e.g. Comedy, Drama"
          />

          {/* Duration */}
          <label>Duration (minutes)</label>
          <input
            type="number"
            name="duration"
            value={form.duration}
            onChange={handleChange}
            placeholder="e.g. 170"
          />

          {/* Release Date */}
          <label>Release Date</label>
          <input
            type="date"
            name="releaseDate"
            value={form.releaseDate}
            onChange={handleChange}
          />

          {/* Trailer */}
          <label>Trailer URL</label>
          <input
            type="url"
            name="trailerUrl"
            value={form.trailerUrl}
            onChange={handleChange}
            placeholder="e.g. https://youtube.com/watch?v=xvszmNXdM4w"
          />

          {/* Poster Upload */}
          <label>Poster</label>
          <input type="file" accept="image/*" onChange={handleFileChange} />
          {uploading && <p className="uploading">Uploading...</p>}
          {form.posterUrl && (
            <img
              src={form.posterUrl}
              alt="Poster Preview"
              className="poster-preview"
            />
          )}

          {/* Status */}
          <label>Status</label>
          <select name="status" value={form.status} onChange={handleChange}>
            <option value="now_showing">Now Showing</option>
            <option value="coming_soon">Coming Soon</option>
            <option value="expired">Expired</option>
          </select>

          {/* Actions */}
          <div className="form-actions">
            <button
              type="submit"
              className="btn-primary"
              disabled={uploading || submitting}
            >
              {submitting
                ? movie
                  ? "Updating..."
                  : "Adding..."
                : movie
                ? "Update"
                : "Add"}
            </button>
            <button type="button" onClick={onClose} className="btn-cancel">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default MovieForm;
