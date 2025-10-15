import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import NotificationsPage from './components/notifications/NotificationsPage';

const AppTest = () => {
  return (
    <Router>
      <div style={{ minHeight: '100vh', background: '#f8fafc' }}>
        <Routes>
          <Route path="/" element={<NotificationsPage />} />
          <Route path="/notifications" element={<NotificationsPage />} />
        </Routes>
      </div>
    </Router>
  );
};

export default AppTest;
