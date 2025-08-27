import React, { useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "../style/Navbar.css";

const Navbar = () => {
    const { user, logout } = useAuth();
    const [open, setOpen] = useState(false);
    
  return (
    <nav className="navbar">
      <div className="nav-container">
        {/* Logo */}
        <Link to="/" className="nav-logo">
          🎬 Quick Show
        </Link>

        {/* Nav links */}
        <div className="nav-links">
          <NavLink to="/" className="nav-link">
            Home
          </NavLink>
          <NavLink to="/movies" className="nav-link">
            Movies
          </NavLink>
          <NavLink to="/booking" className="nav-link">
            Booking
          </NavLink>
        </div>

        {/* Auth */}
        <div className="nav-auth">
          {user ? (
            <div className="profile">
              <img
                src={user.picture}
                alt="profile"
                className="profile-pic"
                onClick={() => setOpen(!open)}
              />
              {open && (
                <div className="profile-dropdown">
                  <p className="profile-name">{user.name}</p>
                  <button className="logout-btn" onClick={logout}>
                    Logout
                  </button>
                </div>
              )}
            </div>
          ) : (
            <a
              href="http://localhost:4000/api/auth/google"
              className="btn login-btn"
            >
              Login
            </a>
          )}
        </div>
      </div>
    </nav>
  )
}

export default Navbar