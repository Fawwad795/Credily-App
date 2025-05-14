import React from 'react';
import { Link } from 'react-router-dom';

const NotFoundPage = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-4">
      <div className="text-center">
        <h1 className="text-9xl font-bold grad-text">woahhh</h1>
        <p className="text-2xl md:text-3xl font-light text-gray-700 mt-4 mb-8">
          slow down there tiger
        </p>
        <p className="text-md text-gray-500 mb-8">
          The page you are looking for does not exist. It might have been moved or deleted.
        </p>
        <Link
          to="/home"
          className="px-6 py-3 text-lg font-semibold text-white grad rounded-lg shadow-md hover:opacity-90 transition-opacity duration-300"
        >
          Return to Home
        </Link>
      </div>
    </div>
  );
};

export default NotFoundPage; 