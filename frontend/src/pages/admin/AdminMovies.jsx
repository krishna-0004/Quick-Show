import React, { useEffect, useState } from "react";
import { api } from "../../utils/axios";
import MovieForm from "../../components/Admin/MovieForm";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "../../style/MovieForm.css";

const AdminMovies = () => {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editMovie, setEditMovie] = useState(null);

  const fetchMovies = async () => {
    try {
      const res = await api.get("/movie");
      if (res.data.success) {
        setMovies(res.data.movies);
      }
    } catch (err) {
      toast.error("Failed to load movies");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this movie?")) return;
    try {
      await api.delete(`/movie/${id}`);
      toast.success("Movie deleted successfully");
      fetchMovies();
    } catch {
      toast.error("Failed to delete movie");
    }
  };

  const handleEdit = (movie) => {
    setEditMovie(movie);
    setShowForm(true);
  };

  useEffect(() => {
    fetchMovies();
  }, []);

  return (
    <div className="movie-admin">
      <ToastContainer />
      <div className="header">
        <h2>🎬 Manage Movies</h2>
        <button
          onClick={() => {
            setEditMovie(null);
            setShowForm(true);
          }}
          className="btn-primary"
        >
          ➕ Add Movie
        </button>
      </div>

      {loading ? (
        <p>Loading movies...</p>
      ) : movies.length === 0 ? (
        <p className="no-data">No movies found</p>
      ) : (
        <table className="movie-table">
          <thead>
            <tr>
              <th>Poster</th>
              <th>Title</th>
              <th>Language</th>
              <th>Genre</th>
              <th>Release Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {movies.map((m) => (
              <tr key={m._id}>
                <td>
                  <img
                    src={m.poster?.url || m.poster}
                    alt={m.title}
                    className="poster"
                  />
                </td>
                <td>{m.title}</td>
                <td>{m.language}</td>
                <td>
                  {Array.isArray(m.genre) ? m.genre.join(", ") : m.genre}
                </td>
                <td>{new Date(m.releaseDate).toLocaleDateString()}</td>
                <td>
                  <button
                    onClick={() => handleEdit(m)}
                    className="btn-edit"
                  >
                    ✏️ Edit
                  </button>
                  <button
                    onClick={() => handleDelete(m._id)}
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
        <MovieForm
          movie={editMovie}
          onClose={() => setShowForm(false)}
          onSuccess={() => {
            setShowForm(false);
            fetchMovies();
          }}
        />
      )}
    </div>
  );
};

export default AdminMovies;
