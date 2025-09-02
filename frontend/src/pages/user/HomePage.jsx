import React from "react";
import HeroSlider from "../../components/HeroSlider";
import PublicMovieList from "../../components/PublicMovieList";

const HomePage = () => {
  return (
    <div className="page-content">
      <HeroSlider />
      <PublicMovieList />
    </div>
  );
};

export default HomePage;
