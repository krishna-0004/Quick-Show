import React from 'react';
import Slider from 'react-slick';
import "../style/HeroSlider.css";

import img1 from "../assets/wallpapers/1.jpeg";
import img2 from "../assets/wallpapers/2.jpeg";
import img3 from "../assets/wallpapers/3.jpeg";
import img4 from "../assets/wallpapers/4.jpeg";
import img5 from "../assets/wallpapers/5.jpeg";

const HeroSlider = () => {
    const sliderImg = [
        { title: "First Img", Url: img1 },
        { title: "Second Img", Url: img2 },
        { title: "Third Img", Url: img3 },
        { title: "Fourth Img", Url: img4 },
        { title: "Fifth Img", Url: img5 },
    ];

    const settings = {
        dots: true,
        infinite: true,
        speed: 900,          
        slidesToShow: 1,
        slidesToScroll: 1,
        autoplay: true,
        autoplaySpeed: 4000, 
        fade: false,         
        cssEase: "linear",   
        pauseOnHover: false, 
    };

    return (
        <div className="hero-slider">
            <Slider {...settings}>
                {sliderImg.map((img, idx) => (
                    <div key={idx} className="slide">
                        <img src={img.Url} alt={img.title} className="slide-img" />
                    </div>
                ))}
            </Slider>
        </div>
    )
}

export default HeroSlider
