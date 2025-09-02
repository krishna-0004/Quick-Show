import React from "react";
import "../style/Footer.css"

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-container">
        
        {/* Left Section */}
        <div className="footer-logo">
          <h2>Quick Show</h2>
          <p>Book your favorite movies anytime, anywhere.</p>
        </div>

        {/* Center Section */}
        <div className="footer-links">
          <h4>Quick Links</h4>
          <ul>
            <li><a href="/">Home</a></li>
            <li><a href="/movies">Movies</a></li>
            <li><a href="/about">About Us</a></li>
            <li><a href="/contact">Contact</a></li>
          </ul>
        </div>

        {/* Right Section */}
        <div className="footer-social">
          <h4>Follow Us</h4>
          <div className="social-icons">
            <a href="#"><i className="fab fa-facebook-f"></i></a>
            <a href="#"><i className="fab fa-twitter"></i></a>
            <a href="#"><i className="fab fa-instagram"></i></a>
            <a href="#"><i className="fab fa-youtube"></i></a>
          </div>
        </div>
      </div>

      <div className="footer-bottom">
        <p>© {new Date().getFullYear()} Quick Show. All Rights Reserved.</p>
      </div>
    </footer>
  );
};

export default Footer;
