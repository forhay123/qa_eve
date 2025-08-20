import React from 'react';

const About = () => {
  return (
    <section className="py-5" id="about">
      <div className="container">
        <div className="row align-items-center g-5">
          <div className="col-lg-6">
            <img
              src="/img/about.jpg"
              alt="About ABapp"
              className="img-fluid rounded shadow-sm"
            />
          </div>

          <div className="col-lg-6">
            <h2 className="fw-bold text-primary mb-3">About ABapp</h2>
            <p className="text-muted mb-3">
              ABapp is your smart academic assistant, designed to enhance the way students learn and interact with study materials. By leveraging the power of AI, we help students generate questions from PDFs, answer them, and track progress — all in one place.
            </p>
            <p className="text-muted mb-4">
              Whether you're preparing for exams, revising class notes, or improving your comprehension, ABapp gives you the tools to study smarter and more efficiently.
            </p>
            <a href="#services" className="btn btn-primary">
              Explore Our Services
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};

export default About;
