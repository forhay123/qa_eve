import React from 'react';

const testimonials = [
  {
    img: 'img/testimonial-1.jpg',
    text: 'Tempor erat elitr...',
    name: 'Client Name',
    profession: 'Profession',
  },
  {
    img: 'img/testimonial-2.jpg',
    text: 'Diam dolor diam ipsum...',
    name: 'Client Name',
    profession: 'Profession',
  },
  {
    img: 'img/testimonial-3.jpg',
    text: 'Clita erat ipsum...',
    name: 'Client Name',
    profession: 'Profession',
  },
  {
    img: 'img/testimonial-4.jpg',
    text: 'Et lorem et sit...',
    name: 'Client Name',
    profession: 'Profession',
  },
];

const TestimonialSection = () => {
  return (
    <div className="container py-5">
      <div className="text-center mb-5">
        <h6 className="text-primary text-uppercase">Testimonial</h6>
        <h1 className="display-5">Our Students Say!</h1>
      </div>
      <div className="row g-4">
        {testimonials.map((testimonial, index) => (
          <div className="col-md-6" key={index}>
            <div className="bg-light p-4 rounded shadow-sm h-100 text-center">
              <img
                src={testimonial.img}
                alt="client"
                className="rounded-circle mb-3"
                style={{ width: '80px', height: '80px', objectFit: 'cover' }}
              />
              <p className="mb-2">{testimonial.text}</p>
              <h6 className="mb-0 text-primary">{testimonial.name}</h6>
              <small className="text-muted">{testimonial.profession}</small>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TestimonialSection;
