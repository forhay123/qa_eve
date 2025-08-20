// src/components/Home/Carousel.jsx
import React from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Navigation, Pagination } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import '../../pages/DashboardPage.css'; // make sure the CSS is loaded

const Carousel = () => {
  return (
    <div className="carousel-container">
      <Swiper
        modules={[Autoplay, Navigation, Pagination]}
        navigation
        pagination={{ clickable: true }}
        autoplay={{ delay: 5000 }}
        loop
      >
        {[1, 2].map((i) => (
          <SwiperSlide key={i}>
            <div className="carousel-slide position-relative">
              <img
                className="img-fluid"
                src={`img/carousel-${i}.jpg`}
                alt={`Slide ${i}`}
              />
              <div className="carousel-overlay d-flex align-items-center justify-content-center">
                <div className="carousel-text-box text-center">
                  <h5 className="text-uppercase mb-3">Best Online Courses</h5>
                  <h1 className="display-4 fw-bold">
                    {i === 1
                      ? 'The Best Online Learning Platform'
                      : 'Get Educated Online From Your Home'}
                  </h1>
                  <p className="fs-5 mb-4">
                    Vero elitr justo clita lorem. Ipsum dolor at sed stet sit
                    diam no.
                  </p>
                  <a href="#" className="btn btn-primary me-3">
                    Read More
                  </a>
                  <a href="#" className="btn btn-light">
                    Join Now
                  </a>
                </div>
              </div>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
};

export default Carousel;
