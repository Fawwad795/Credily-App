import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Signup from './Signup';
import Login from './Login';
import MessagingPage from './MessagingPage'; // Import the MessagingPage component

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/signup" />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/login" element={<Login />} />
        <Route path="/messages" element={<MessagingPage />} /> {/* Add route for MessagingPage */}
      </Routes>
    </Router>
  );
};

export default App;
