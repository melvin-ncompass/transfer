import React from 'react';
import Chat from '../components/Chat';

export default function Contact() {
  return (
    <div className="main-content">
      <section className="forms-section" style={{ gridColumn: '1 / -1' }}>
        <h3>
          <i className="fas fa-envelope" /> Contact Form
        </h3>
        <div className="forms-container">
          <div className="form-card">
            <form id="contactForm">
              <div className="form-group">
                <label htmlFor="contactName">Name:</label>
                <input type="text" id="contactName" name="name" placeholder="Enter your name" />
              </div>
              <div className="form-group">
                <label htmlFor="contactEmail">Email:</label>
                <input type="email" id="contactEmail" name="email" placeholder="Enter your email" />
              </div>
              <div className="form-group">
                <label htmlFor="contactMessage">Message:</label>
                <textarea id="contactMessage" name="message" placeholder="Enter your message" />
              </div>
              <button type="submit" className="btn-primary">Send Message</button>
            </form>
          </div>
        </div>
      </section>
      <Chat />
    </div>
  );
}


