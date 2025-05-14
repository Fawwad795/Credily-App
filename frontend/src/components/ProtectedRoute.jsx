import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';

const ProtectedRoute = ({ element }) => {
  const token = localStorage.getItem('token'); // Or your specific auth key
  const location = useLocation();

  if (!token) {
    // Redirect them to the /signup page, but save the current location they were
    // trying to go to in case they successfully sign up/log in and want to return.
    // However, for this request, a simple redirect to /signup is sufficient.
    return <Navigate to="/signup" replace />; 
  }

  return element;
};

export default ProtectedRoute; 