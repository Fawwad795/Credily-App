import React from 'react';
import { Link } from 'react-router-dom';

const Homepage = () => {
  return (
    <div className="flex flex-col min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-teal-500 text-white py-4 shadow-md">
        <div className="container mx-auto flex justify-between items-center px-4">
          <h1 className="text-2xl font-bold">SocialApp</h1>
          <nav>
            <ul className="flex space-x-4">
              <li>
                <Link to="/signup" className="hover:underline">
                  Signup
                </Link>
              </li>
              <li>
                <Link to="/login" className="hover:underline">
                  Login
                </Link>
              </li>
              <li>
                <Link to="/messages" className="hover:underline">
                  Messages
                </Link>
              </li>
            </ul>
          </nav>
        </div>
      </header>

      {/* Main Section */}
      <main className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-4xl font-bold text-teal-700 mb-4">
            Welcome to SocialApp!
          </h2>
          <p className="text-gray-700 mb-6">
            Connect with your friends and family. Share moments, chat, and stay connected.
          </p>
          <div className="space-x-4">
            <Link
              to="/signup"
              className="bg-teal-500 text-white px-6 py-3 rounded-lg shadow-md hover:bg-teal-600 transition duration-300"
            >
              Get Started
            </Link>
            <Link
              to="/login"
              className="bg-gray-200 text-teal-700 px-6 py-3 rounded-lg shadow-md hover:bg-gray-300 transition duration-300"
            >
              Login
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-800 text-white py-4">
        <div className="container mx-auto text-center">
          <p>&copy; 2025 SocialApp. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Homepage;