import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { X, Menu, Search, MessageSquare, Bell, User, LogOut } from 'lucide-react';

const MobileNav = ({ onSearchClick, onNotificationsClick, onSignOut }) => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  const handleSearchClick = () => {
    onSearchClick();
    setIsOpen(false);
  };

  const handleNotificationsClick = () => {
    onNotificationsClick();
    setIsOpen(false);
  };

  const handleSignOut = () => {
    onSignOut();
    setIsOpen(false);
  };

  return (
    <div className="md:hidden">
      {/* Hamburger Button */}
      <button
        onClick={toggleMenu}
        className="fixed top-4 left-4 z-50 p-2 rounded-lg bg-white shadow-lg"
      >
        {isOpen ? (
          <X className="w-6 h-6 text-gray-800" />
        ) : (
          <Menu className="w-6 h-6 text-gray-800" />
        )}
      </button>

      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={toggleMenu}
        />
      )}

      {/* Mobile Menu */}
      <div
        className={`fixed top-0 left-0 w-64 h-full bg-white z-40 transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full pt-16 pb-6 px-4">
          <nav className="flex-1">
            <ul className="space-y-4">
            <li>
              <Link
                to="/"
                className="flex items-center p-2 text-gray-900 rounded-lg dark:text-white hover:bg-green-100 dark:hover:bg-green-700 group"
              >
            <svg
    className="w-5 h-5 text-gray-500 transition duration-75 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white"
    aria-hidden="true"
    xmlns="http://www.w3.org/2000/svg"
    fill="currentColor"
    viewBox="0 0 20 20"
  >
    <path d="M10.707 1.707a1 1 0 0 0-1.414 0L2 9v9a1 1 0 0 0 1 1h5a1 1 0 0 0 1-1v-4h2v4a1 1 0 0 0 1 1h5a1 1 0 0 0 1-1V9l-7.293-7.293Z" />
  </svg>
                <span className="ms-3 text-gray-900">Home</span>
              </Link>
            </li>
              <li>
                <Link
                  to="/profile"
                  className="flex items-center p-2 text-gray-900 rounded-lg hover:bg-green-100"
                  onClick={() => setIsOpen(false)}
                >
                  <User className="w-5 h-5 text-gray-500" />
                  <span className="ml-3">Profile</span>
                </Link>
              </li>
              <li>
                <button
                  onClick={handleSearchClick}
                  className="w-full flex items-center p-2 text-gray-900 rounded-lg hover:bg-green-100"
                >
                  <Search className="w-5 h-5 text-gray-500" />
                  <span className="ml-3">Search</span>
                </button>
              </li>
              <li>
                <Link
                  to="/message"
                  className="flex items-center p-2 text-gray-900 rounded-lg hover:bg-green-100"
                  onClick={() => setIsOpen(false)}
                >
                  <MessageSquare className="w-5 h-5 text-gray-500" />
                  <span className="ml-3">Inbox</span>
                </Link>
              </li>
              <li>
                <button
                  onClick={handleNotificationsClick}
                  className="w-full flex items-center p-2 text-gray-900 rounded-lg hover:bg-green-100"
                >
                  <Bell className="w-5 h-5 text-gray-500" />
                  <span className="ml-3">Notifications</span>
                </button>
              </li>
            </ul>
          </nav>
          <button
            onClick={handleSignOut}
            className="flex items-center p-2 text-gray-900 rounded-lg hover:bg-green-100 mt-auto"
          >
            <LogOut className="w-5 h-5 text-gray-500" />
            <span className="ml-3">Sign Out</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default MobileNav; 