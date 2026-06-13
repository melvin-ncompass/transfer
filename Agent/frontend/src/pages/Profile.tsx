import React from 'react';
import Chat from '../components/Chat';

export default function Profile() {
  return (
    <div className="main-content">
      <section className="forms-section" style={{ gridColumn: '1 / -1' }}>
        <h3>
          <i className="fas fa-id-card" /> Profile Update
        </h3>
        <div className="forms-container">
          <div className="form-card">
            <form id="profileForm">
              <div className="form-group">
                <label htmlFor="profileName">Full Name:</label>
                <input type="text" id="profileName" name="fullName" placeholder="Enter full name" />
              </div>
              <div className="form-group">
                <label htmlFor="profileTitle">Job Title:</label>
                <input type="text" id="profileTitle" name="jobTitle" placeholder="Enter job title" />
              </div>
              <div className="form-group">
                <label htmlFor="profileBio">Bio:</label>
                <textarea id="profileBio" name="bio" placeholder="Enter your bio" />
              </div>
              <button type="submit" className="btn-primary">Update Profile</button>
            </form>
          </div>
        </div>
      </section>
      <Chat />
    </div>
  );
}


