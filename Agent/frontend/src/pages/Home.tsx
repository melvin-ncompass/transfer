import React from 'react';
import Chat from '../components/Chat';

export default function Home() {
  return (
    <div className="main-content">
      <section className="forms-section" style={{ gridColumn: '1 / -1' }}>
        <h3>
          <i className="fas fa-file-alt" /> Interactive Forms
        </h3>
        <p style={{ marginBottom: 12 }}>Use the navigation to access each form page.</p>
      </section>
      <Chat />
    </div>
  );
}


