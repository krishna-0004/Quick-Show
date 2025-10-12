// src/components/Navbar.jsx
import React, { useState, useEffect } from "react";
import { NavLink, Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "../style/Navbar.css";

const Navbar = () => {
  const { user, logout, isAdmin } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    setDropdownOpen(false);
    navigate("/login");
  };

  // Detect screen resize
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <>
      {/* === TOP NAVBAR === */}
      <nav className="navbar">
        <div className="nav-container">
          {/* Logo */}
          <Link to="/" className="nav-logo">
            🎬 Quick Show
          </Link>

          {/* === Desktop Nav Links === */}
          {!isMobile && (
            <div className="nav-links">
              <NavLink to="/" className="nav-link">
                Home
              </NavLink>
              <NavLink to="/about" className="nav-link">
                About Us
              </NavLink>
              <NavLink to="/my-bookings" className="nav-link">
                My Booking
              </NavLink>
              {isAdmin?.() && (
                <NavLink to="/admin" className="nav-link">
                  Admin
                </NavLink>
              )}
            </div>
          )}

          {/* === Auth/Profile === */}
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
                    {isAdmin?.() && (
                      <button
                        className="dropdown-btn"
                        onClick={() => {
                          setDropdownOpen(false);
                          navigate("/admin");
                        }}
                      >
                        Dashboard
                      </button>
                    )}
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
              >
                Login
              </a>
            )}
          </div>
        </div>
      </nav>

      {/* === BOTTOM NAVBAR (Mobile Only) === */}
      {isMobile && (
        <div className="bottom-nav">
          <NavLink to="/" className="bottom-link">
            <span>🏠</span>
            <span>Home</span>
          </NavLink>
          <NavLink to="/about" className="bottom-link">
            <span>👥</span>
            <span>About Us</span>
          </NavLink>
          <NavLink to="/my-bookings" className="bottom-link">
            <span>🎟️</span>
            <span>My Booking</span>
          </NavLink>
          {isAdmin?.() && (
            <NavLink to="/admin" className="bottom-link">
              <span>⚙️</span>
              <span>Admin</span>
            </NavLink>
          )}
        </div>
      )}
    </>
  );
};

export default Navbar;
