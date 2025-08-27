import React, { useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "../style/Navbar.css";

const Navbar = () => {
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const handleLogout = () => {
    logout();
    setMenuOpen(false);
    setDropdownOpen(false);
  };

  return (
    <nav className="navbar">
      <div className="nav-container">
        {/* Logo */}
        <Link to="/" className="nav-logo">
          🎬 Quick Show
        </Link>

        {/* Hamburger (Mobile) */}
        <button
          className={`hamburger ${menuOpen ? "active" : ""}`}
          onClick={() => setMenuOpen(!menuOpen)}
        >
          <span></span>
          <span></span>
          <span></span>
        </button>

        {/* Nav links */}
        <div className={`nav-links ${menuOpen ? "show" : ""}`}>
          <NavLink
            to="/"
            className="nav-link"
            onClick={() => setMenuOpen(false)}
          >
            Home
          </NavLink>
          <NavLink
            to="/movies"
            className="nav-link"
            onClick={() => setMenuOpen(false)}
          >
            Movies
          </NavLink>
          <NavLink
            to="/booking"
            className="nav-link"
            onClick={() => setMenuOpen(false)}
          >
            Booking
          </NavLink>

          {/* Auth Section (Mobile sidebar shows at bottom) */}
          <div className="nav-auth">
            {user ? (
              <div className="profile">
                <img
                  src={user.picture || "https://i.pravatar.cc/40"}
                  alt="profile"
                  className="profile-pic"
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                />
                {dropdownOpen && (
                  <div className="profile-dropdown">
                    <p className="profile-name">{user.name}</p>
                    <button className="logout-btn" onClick={handleLogout}>
                      Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <a
                href={`${import.meta.env.VITE_API_URL}/api/auth/google`}
                className="btn login-btn"
                onClick={() => setMenuOpen(false)}
              >
                Login
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Overlay (mobile when menu open) */}
      {menuOpen && (
        <div className="overlay" onClick={() => setMenuOpen(false)}></div>
      )}
    </nav>
  );
};

export default Navbar;
