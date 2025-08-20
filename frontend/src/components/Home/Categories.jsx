import React from 'react';

const Categories = () => {
  const categories = [
    { title: 'Mathematics', icon: 'fas fa-square-root-alt', color: 'text-primary' },
    { title: 'Science', icon: 'fas fa-flask', color: 'text-success' },
    { title: 'English', icon: 'fas fa-book', color: 'text-warning' },
    { title: 'History', icon: 'fas fa-landmark', color: 'text-danger' },
    { title: 'Computer Science', icon: 'fas fa-laptop-code', color: 'text-info' },
    { title: 'Geography', icon: 'fas fa-globe', color: 'text-secondary' },
  ];

  return (
    <section className="py-5 bg-light" id="categories">
      <div className="container">
        <div className="text-center mb-5">
          <h2 className="fw-bold text-primary">Subject Categories</h2>
          <p className="text-muted">Explore learning resources across a variety of academic fields.</p>
        </div>

        <div className="row g-4">
          {categories.map((cat, idx) => (
            <div className="col-6 col-md-4 col-lg-3" key={idx}>
              <div className="card text-center p-4 shadow-sm hover-lift h-100">
                <i className={`${cat.icon} fa-2x mb-3 ${cat.color}`}></i>
                <h6 className="mb-0">{cat.title}</h6>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Categories;
