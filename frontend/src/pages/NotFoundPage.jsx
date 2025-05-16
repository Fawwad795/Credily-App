import React from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../components/Nav'; // Import useTheme hook

const NotFoundPage = () => {
  const { darkMode, toggleDarkMode } = useTheme(); // Use the dark mode context
  
  return (
    <div className={`min-h-screen flex flex-col items-center justify-center ${
      darkMode ? 'bg-gray-900 text-white' : 'bg-gray-100'
    } p-4`}>
      {/* Dark mode toggle button */}
      <button
        onClick={toggleDarkMode}
        className="fixed top-4 right-4 z-50 p-2 rounded-full focus:outline-none bg-opacity-80 shadow-lg transition-all"
        style={{
          backgroundColor: darkMode ? "rgba(30, 41, 59, 0.8)" : "rgba(255, 255, 255, 0.8)"
        }}
        aria-label="Toggle dark mode"
      >
        {darkMode ? (
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="5"></circle>
            <line x1="12" y1="1" x2="12" y2="3"></line>
            <line x1="12" y1="21" x2="12" y2="23"></line>
            <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
            <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
            <line x1="1" y1="12" x2="3" y2="12"></line>
            <line x1="21" y1="12" x2="23" y2="12"></line>
            <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
            <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
          </svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
          </svg>
        )}
      </button>
      
      <div className="text-center">
        <h1 className="text-9xl font-bold grad-text">woahhh</h1>
        <p className={`text-2xl md:text-3xl font-light ${
          darkMode ? 'text-gray-300' : 'text-gray-700'
        } mt-4 mb-8`}>
          slow down there tiger
        </p>
        <p className={`text-md ${
          darkMode ? 'text-gray-400' : 'text-gray-500'
        } mb-8`}>
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