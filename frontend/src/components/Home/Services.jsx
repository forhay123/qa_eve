import React from 'react';

const Services = () => {
  return (
    <section className="py-5 bg-light" id="services">
      <div className="container">
        <div className="text-center mb-5">
          <h2 className="fw-bold text-primary">Our Services</h2>
          <p className="text-muted">
            Empowering your academic journey with powerful tools and features.
          </p>
        </div>

        <div className="row g-4">
          <div className="col-md-4">
            <div className="card h-100 text-center border-0 shadow-sm p-4">
              <i className="fas fa-upload fa-3x text-primary mb-3"></i>
              <h5 className="fw-bold">Upload PDFs</h5>
              <p className="text-muted">
                Seamlessly upload study materials or assignments in PDF format for analysis or storage.
              </p>
            </div>
          </div>

          <div className="col-md-4">
            <div className="card h-100 text-center border-0 shadow-sm p-4">
              <i className="fas fa-question-circle fa-3x text-success mb-3"></i>
              <h5 className="fw-bold">View Questions</h5>
              <p className="text-muted">
                Instantly generate and view intelligent questions based on your uploaded documents.
              </p>
            </div>
          </div>

          <div className="col-md-4">
            <div className="card h-100 text-center border-0 shadow-sm p-4">
              <i className="fas fa-pencil-alt fa-3x text-warning mb-3"></i>
              <h5 className="fw-bold">Submit Answers</h5>
              <p className="text-muted">
                Respond to generated questions directly in the app and get real-time feedback.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Services;
