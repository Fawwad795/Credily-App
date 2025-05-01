import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Homepage from './Homepage'; // Import Homepage
import Signup from './Signup';
import Login from './Login';
import MessagingPage from './MessagingPage';

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Homepage />} /> {/* Set Homepage as the default route */}
        <Route path="/signup" element={<Signup />} />
        <Route path="/login" element={<Login />} />
        <Route path="/messages" element={<MessagingPage />} />
      </Routes>
    </Router>
  );
};

export default App;
