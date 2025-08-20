// src/components/Home/Courses.jsx
import React from 'react';

const Courses = () => {
  const courses = [
    {
      title: 'Algebra Basics',
      subject: 'Mathematics',
      icon: 'fas fa-calculator',
      color: 'text-primary',
      description: 'Master equations, variables, and expressions from scratch.',
    },
    {
      title: 'Intro to Biology',
      subject: 'Science',
      icon: 'fas fa-dna',
      color: 'text-success',
      description: 'Understand living systems and cell structures.',
    },
    {
      title: 'Grammar & Composition',
      subject: 'English',
      icon: 'fas fa-pen-fancy',
      color: 'text-warning',
      description: 'Strengthen writing skills and grammar fundamentals.',
    },
    {
      title: 'World History 101',
      subject: 'History',
      icon: 'fas fa-monument',
      color: 'text-danger',
      description: 'Explore ancient civilizations to modern societies.',
    },
  ];

  return (
    <section className="py-5" id="courses">
      <div className="container">
        <div className="text-center mb-5">
          <h2 className="fw-bold text-primary">Featured Courses</h2>
          <p className="text-muted">
            Jump into some of our most popular modules.
          </p>
        </div>

        <div className="row g-4">
          {courses.map((course, index) => (
            <div className="col-sm-6 col-lg-3" key={index}>
              <div className="card h-100 shadow-sm p-4 text-center hover-lift">
                <i className={`${course.icon} fa-2x mb-3 ${course.color}`}></i>
                <h5 className="card-title">{course.title}</h5>
                <p className="text-muted small">{course.description}</p>
                <span className="badge bg-light text-dark">{course.subject}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Courses;
