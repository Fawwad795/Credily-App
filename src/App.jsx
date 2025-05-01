import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

import Signup from './Signup';
import Login from './Login';
import MessagingPage from './MessagingPage';
import SearchPage from './SearchPage'; // Import SearchPage

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" />
        <Route path="/signup" element={<Signup />} />
        <Route path="/login" element={<Login />} />
        <Route path="/messages" element={<MessagingPage />} />
        <Route path="/search" element={<SearchPage />} /> {/* Add SearchPage route */}
      </Routes>
    </Router>
  );
};

export default App;
