import React from 'react';

const Footer = () => {
  return (
    <footer className="bg-dark text-white pt-5 pb-3">
      <div className="container">
        <div className="row gy-4">
          <div className="col-md-3">
            <h5>EduApp</h5>
            <p className="small text-light">
              Empowering learners through a modern, accessible platform.
            </p>
          </div>
          <div className="col-md-3">
            <h6 className="text-uppercase">Quick Links</h6>
            <ul className="list-unstyled small">
              <li><a href="#" className="text-light text-decoration-none">About Us</a></li>
              <li><a href="#" className="text-light text-decoration-none">Contact</a></li>
              <li><a href="#" className="text-light text-decoration-none">Privacy</a></li>
              <li><a href="#" className="text-light text-decoration-none">Terms</a></li>
            </ul>
          </div>
          <div className="col-md-3">
            <h6 className="text-uppercase">Contact</h6>
            <p className="small text-light mb-1">123 Street, NY, USA</p>
            <p className="small text-light mb-1">info@example.com</p>
            <p className="small text-light">+123 456 7890</p>
          </div>
          <div className="col-md-3">
            <h6 className="text-uppercase">Newsletter</h6>
            <form className="d-flex">
              <input
                type="email"
                className="form-control me-2"
                placeholder="Your email"
              />
              <button className="btn btn-primary" type="submit">Subscribe</button>
            </form>
          </div>
        </div>

        <hr className="border-secondary mt-4" />

        <div className="text-center small text-light">
          © {new Date().getFullYear()} EduApp. All rights reserved.
        </div>
      </div>
    </footer>
  );
};

export default Footer;
