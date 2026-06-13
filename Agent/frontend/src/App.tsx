import React, { useEffect, useState } from 'react';
import { Link, Route, Routes } from 'react-router-dom';
import Home from './pages/Home';
import Contact from './pages/Contact';
import Profile from './pages/Profile';
import Tasks from './pages/Tasks';

export default function App() {
  const [status, setStatus] = useState<'unknown' | 'connected' | 'disconnected'>('unknown');

  useEffect(() => {
    fetch('/api/health')
      .then((r) => r.json())
      .then(() => setStatus('connected'))
      .catch(() => setStatus('disconnected'));
  }, []);

  return (
    <div className="container">
      <header className="header">
        <h1>
          <i className="fas fa-robot" /> AI Assistant Dashboard
        </h1>
        <nav className="user-status">
          <Link className="btn-secondary" to="/">Home</Link>
          <Link className="btn-secondary" to="/contact">Contact</Link>
          <Link className="btn-secondary" to="/profile">Profile</Link>
          <Link className="btn-secondary" to="/tasks">Tasks</Link>
          <span className="shortcut-hint">Server: {status}</span>
        </nav>
      </header>

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/tasks" element={<Tasks />} />
      </Routes>
    </div>
  );
}


