import React from "react";
import "../../style/AboutUs.css";

const features = [
  {
    title: "Our Vision",
    desc: "To bring a truly cinematic movie-booking experience online — immersive, lightning-fast, and unforgettable.",
    icon: "🎬",
  },
  {
    title: "Our Mission",
    desc: "Quick Show simplifies your movie journey: browse, book, and enjoy with the magic of a premium theater experience from your screen.",
    icon: "🚀",
  },
  {
    title: "Our Values",
    desc: "Innovation, Speed, and User Delight drive everything we do, making every click feel cinematic.",
    icon: "💡",
  },
  {
    title: "Our Experience",
    desc: "Seamless seat selection, real-time availability, secure payments, and interactive interfaces that elevate every movie moment.",
    icon: "⭐",
  },
];

const AboutUs = () => {
  return (
    <div className="about-container">
      {/* Hero Section */}
      <section className="about-hero">
        <h1 className="hero-title">Welcome to Quick Show</h1>
        <p className="hero-subtitle">
          Dive into a cinematic world where every booking feels like the premiere of a blockbuster.
        </p>
      </section>

      {/* Features Section */}
      <section className="about-features">
        {features.map((f, idx) => (
          <div key={idx} className="feature-card">
            <div className="feature-icon">{f.icon}</div>
            <h2 className="feature-title">{f.title}</h2>
            <p className="feature-desc">{f.desc}</p>
          </div>
        ))}
      </section>

      {/* Footer Glow Section */}
      <section className="about-footer">
        <p>
          Quick Show — where movies meet magic, and every booking feels cinematic.
        </p>
      </section>
    </div>
  );
};

export default AboutUs;
