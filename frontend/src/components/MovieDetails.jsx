// src/components/Booking/MovieDetails.jsx
import React from "react";
import "../style/MovieDetails.css";

const MovieDetails = ({ movie, selectedDate, selectedTime }) => {
  if (!movie) return null;

  // Default rating stars (4 if no rating provided)
  const ratingValue = movie.rating ? movie.rating.toFixed(1) : "4.0";

  return (
    <div className="movie-details-card">
      {/* Poster */}
      <div className="poster-container">
        <img
          src={movie.poster.url}
          alt={movie.title}
          className="movie-poster"
        />
        <div className="movie-rating-badge">⭐ {ratingValue}</div>
      </div>

      {/* Movie Info */}
      <div className="movie-info">
        <h2 className="movie-title">{movie.title}</h2>

        {/* Meta Info (side by side grid) */}
        <div className="movie-meta">
          <div className="meta-item">🎬 {movie.genre.join(", ")}</div>
          <div className="meta-item">⏱️ {movie.duration} mins</div>
          <div className="meta-item">🌐 {movie.language}</div>
          {selectedDate && <div className="meta-item">📅 {selectedDate}</div>}
          {selectedTime && <div className="meta-item">🕒 {selectedTime}</div>}
        </div>

        {/* Description */}
        {movie.description && (
          <p className="movie-description">{movie.description}</p>
        )}

        {/* Trailer Button */}
        {movie.trailerUrl && (
          <a
            href={movie.trailerUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="trailer-btn"
          >
            🎥 Watch Trailer
          </a>
        )}
      </div>
    </div>
  );
};

export default MovieDetails;
