// src/components/Home/TeamSection.jsx
import React from 'react';

const instructors = [
  { name: 'Jane Doe', role: 'Math Expert', img: 'img/team-1.jpg' },
  { name: 'John Smith', role: 'Science Tutor', img: 'img/team-2.jpg' },
  { name: 'Emily Ray', role: 'History Mentor', img: 'img/team-3.jpg' },
  { name: 'Alex Ford', role: 'English Coach', img: 'img/team-4.jpg' }
];

const TeamSection = () => (
  <div className="container-xxl py-5">
    <div className="container">
      <div className="text-center">
        <h6 className="section-title bg-white text-center text-primary px-3">Instructors</h6>
        <h1 className="mb-5">Expert Instructors</h1>
      </div>
      <div className="row g-4">
        {instructors.map((instructor, i) => (
          <div key={i} className="col-lg-3 col-md-6 wow fadeInUp" data-wow-delay={`${0.2 * i}s`}>
            <div className="team-item">
              <img className="img-fluid" src={instructor.img} alt={instructor.name} />
              <div className="position-relative d-flex justify-content-center" style={{ marginTop: '-23px' }}>
                <div className="bg-light d-flex justify-content-center pt-2 px-1">
                  <a className="btn btn-sm-square btn-primary mx-1" href="#"><i className="fab fa-facebook-f"></i></a>
                  <a className="btn btn-sm-square btn-primary mx-1" href="#"><i className="fab fa-twitter"></i></a>
                  <a className="btn btn-sm-square btn-primary mx-1" href="#"><i className="fab fa-instagram"></i></a>
                </div>
              </div>
              <div className="team-text">
                <h5 className="mb-0">{instructor.name}</h5>
                <p>{instructor.role}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

export default TeamSection;
