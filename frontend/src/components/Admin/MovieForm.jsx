import React, { useState } from "react";
import { api } from "../../utils/axios";
import { toast } from "react-toastify";
import "../../style/MovieForm.css";

const MovieForm = ({ movie, onClose, onSuccess }) => {
  const [form, setForm] = useState({
    title: movie?.title || "",
    description: movie?.description || "",
    language: movie?.language || "",
    // ✅ Handle both array or string for genre
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

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // ✅ Handle local file upload to Cloudinary
  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);
    formData.append(
      "upload_preset",
      import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET
    ); // Cloudinary preset

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
      setForm({ ...form, posterUrl: data.secure_url }); // ✅ save URL
      toast.success("Poster uploaded successfully!");
    } catch (err) {
      toast.error("Failed to upload poster");
    } finally {
      setUploading(false);
    }
  };

  // ✅ Ensure genre is always saved as an array
  const handleSubmit = async (e) => {
    e.preventDefault();

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
    }
  };

  return (
    <div className="modal">
      <div className="modal-content">
        <h3>{movie ? "Edit Movie" : "Add Movie"}</h3>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            name="title"
            value={form.title}
            onChange={handleChange}
            placeholder="Movie Title"
            required
          />
          <textarea
            name="description"
            value={form.description}
            onChange={handleChange}
            placeholder="Description"
          ></textarea>
          <input
            type="text"
            name="language"
            value={form.language}
            onChange={handleChange}
            placeholder="Language"
          />
          <input
            type="text"
            name="genre"
            value={form.genre}
            onChange={handleChange}
            placeholder="Genre (comma separated)"
          />
          <input
            type="number"
            name="duration"
            value={form.duration}
            onChange={handleChange}
            placeholder="Duration (min)"
          />
          <input
            type="date"
            name="releaseDate"
            value={form.releaseDate}
            onChange={handleChange}
          />
          <input
            type="url"
            name="trailerUrl"
            value={form.trailerUrl}
            onChange={handleChange}
            placeholder="Trailer URL"
          />

          {/* ✅ Upload from local */}
          <input type="file" accept="image/*" onChange={handleFileChange} />
          {uploading && <p>Uploading...</p>}
          {form.posterUrl && (
            <img
              src={form.posterUrl}
              alt="Poster Preview"
              style={{ width: "120px", marginTop: "10px" }}
            />
          )}

          <select name="status" value={form.status} onChange={handleChange}>
            <option value="now_showing">Now Showing</option>
            <option value="coming_soon">Coming Soon</option>
            <option value="expired">Expired</option>
          </select>

          <div className="form-actions">
            <button type="submit" className="btn-primary" disabled={uploading}>
              {movie ? "Update" : "Add"}
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
