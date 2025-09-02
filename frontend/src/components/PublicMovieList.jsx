// src/components/PublicMovieList.jsx
import React, { useState, useEffect, useMemo } from "react";
import { api } from "../utils/axios";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import Loader from "./Loader";
import "../style/PublicMovieList.css";

const PublicMovieList = ({ bookingStatus, language, genre, q }) => {
  const [movies, setMovies] = useState({ now_showing: [], coming_soon: [] });
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const params = useMemo(() => {
    const p = {};
    if (bookingStatus) p.bookingStatus = bookingStatus;
    if (language) p.language = language;
    if (genre) p.genre = genre;
    if (q) p.q = q;
    return p;
  }, [bookingStatus, language, genre, q]);

  const fetchMovies = async () => {
    try {
      setLoading(true);
      const { data } = await api.get("/movie", { params });

      if (data.success) {
        // ✅ Handle grouped API response
        if (data.movies.now_showing || data.movies.coming_soon) {
          setMovies({
            now_showing: data.movies.now_showing || [],
            coming_soon: data.movies.coming_soon || [],
          });
        } else {
          // fallback: flat array
          setMovies({
            now_showing: (data.movies || []).filter(
              (m) => m.status === "now_showing"
            ),
            coming_soon: (data.movies || []).filter(
              (m) => m.status === "coming_soon"
            ),
          });
        }
      } else {
        setMovies({ now_showing: [], coming_soon: [] });
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to fetch movies");
      setMovies({ now_showing: [], coming_soon: [] });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMovies();
  }, [JSON.stringify(params)]);

  if (loading) return <Loader />;

  if (!movies.now_showing.length && !movies.coming_soon.length) {
    return (
      <div className="movie-public">
        <p className="no-data">No movies available right now.</p>
      </div>
    );
  }

  // ✅ Convert rating to stars (no empty stars, only full + half)
  const renderStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const halfStar = rating % 1 >= 0.5;

    for (let i = 0; i < fullStars; i++) {
      stars.push(<span key={`star-${i}`}>⭐</span>);
    }

    if (halfStar) {
      stars.push(<span key="half">✨</span>);
    }

    return stars;
  };

  const renderMovieCard = (m) => {
    const poster = typeof m.poster === "string" ? m.poster : m.poster?.url;
    const rating = m.rating && m.rating > 0 ? m.rating : 4;
    const canBook = m.bookingStatus !== "closed";

    return (
      <div key={m._id} className="movie-card">
        <div className="poster-container">
          <img
            src={poster || "/placeholder_poster.png"}
            alt={m.title}
            className="movie-poster"
          />
          <span className="movie-rating">{renderStars(rating)}</span>
        </div>

        <div className="movie-info">
          <h3 className="movie-title">{m.title}</h3>
          <p className="movie-meta">
            {Array.isArray(m.genre) ? m.genre.join(", ") : m.genre}
            {m.language ? ` • ${m.language}` : ""}
          </p>
          <p className="movie-extra">
            ⏱ {m.duration} min
            {m.releaseDate && (
              <> • 🎬 {new Date(m.releaseDate).toLocaleDateString()}</>
            )}
          </p>
        </div>

        <div className="movie-actions">
          {canBook && (
            <button
              className="button-primary"
              onClick={() => navigate(`/book/${m._id}`)}
            >
              Book Tickets
            </button>
          )}
          {m.trailerUrl && (
            <a
              href={m.trailerUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="button-secondary"
            >
              🎥 Trailer
            </a>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="movie-public">
      {movies.now_showing.length > 0 && (
        <>
          <h2 className="movie-section-title">🎬 Now Showing</h2>
          <div className="movie-grid">
            {movies.now_showing.map(renderMovieCard)}
          </div>
        </>
      )}

      {movies.coming_soon.length > 0 && (
        <>
          <h2 className="movie-section-title">⏳ Coming Soon</h2>
          <div className="movie-grid">
            {movies.coming_soon.map(renderMovieCard)}
          </div>
        </>
      )}
    </div>
  );
};

export default PublicMovieList;
