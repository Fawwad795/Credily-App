import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import api from "../utils/axios"; // Import the configured axios instance

const SearchSlider = ({ isOpen, onClose }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Search API call
  const handleSearch = useCallback(async () => {
    if (!searchQuery.trim()) return;

    setLoading(true);
    try {
      const response = await api.get(`/users/search?query=${searchQuery}`);
      setResults(response.data.data || []);
    } catch (error) {
      console.error("Error fetching search results:", error);
    } finally {
      setLoading(false);
    }
  }, [searchQuery]);

  // Handle real-time search as user types
  useEffect(() => {
    const delaySearch = setTimeout(() => {
      if (searchQuery.trim().length > 0) {
        handleSearch();
      } else {
        setResults([]);
      }
    }, 500); // 500ms delay to avoid too many requests

    return () => clearTimeout(delaySearch);
  }, [searchQuery, handleSearch]);

  // Navigate to user profile when clicked
  const handleProfileClick = (userId) => {
    navigate(`/profile/${userId}`);
    onClose(); // Close the search slider
  };

  // Generate a placeholder image for users with invalid profile pictures
  const generatePlaceholderAvatar = (username) => {
    const initial = username ? username.charAt(0).toUpperCase() : "U";
    return `https://placehold.co/50/purple/white?text=${initial}`;
  };

  // Handle image error by replacing with placeholder
  const handleImageError = (e, username) => {
    e.target.onerror = null; // Prevent infinite callbacks
    e.target.src = generatePlaceholderAvatar(username);
  };

  return (
    <div
      className={`fixed top-0 right-0 h-full w-80 bg-white shadow-lg transform ${
        isOpen ? "translate-x-0" : "translate-x-full"
      } transition-all duration-300 ease-in-out z-50 rounded-l-2xl`}
    >
      {/* Header */}
      <div className="p-4 border-b flex justify-between items-center bg-gradient-to-r from-[#dc2430] to-[#7b4397] text-white rounded-tl-2xl">
        <h2 className="text-lg font-bold">Search Accounts</h2>
        <button
          onClick={onClose}
          className="text-white hover:text-gray-200 transition-all duration-200 ease-in-out hover:scale-110"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>

      {/* Search Input */}
      <div className="p-4">
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search for accounts..."
            className="w-full px-4 py-2 pl-10 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300 ease-in-out shadow-sm hover:shadow-md bg-gradient-to-r from-purple-50 to-pink-50 hover:from-purple-100 hover:to-pink-100 focus:from-purple-100 focus:to-pink-100 transform hover:scale-[1.02] focus:scale-[1.02]"
          />
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2 transition-all duration-300 group-hover:text-purple-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
      </div>

      {/* Search Results */}
      <div className="p-4 overflow-y-auto max-h-[calc(100vh-8rem)] scrollbar-thin scrollbar-thumb-purple-200 scrollbar-track-transparent">
        {loading ? (
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
          </div>
        ) : results.length > 0 ? (
          <ul className="space-y-2">
            {results.map((account) => (
              <li
                key={account._id}
                className="p-3 rounded-xl hover:bg-gray-50 cursor-pointer transition-all duration-200 ease-in-out border border-gray-100 hover:shadow-md hover:border-purple-100"
                onClick={() => handleProfileClick(account._id)}
              >
                <div className="flex items-center gap-3">
                  <img
                    src={
                      account.profilePicture ||
                      generatePlaceholderAvatar(account.username)
                    }
                    alt="Profile"
                    className="w-10 h-10 rounded-full object-cover ring-2 ring-purple-200 transition-all duration-200 ease-in-out hover:ring-purple-400"
                    onError={(e) => handleImageError(e, account.username)}
                  />
                  <div>
                    <p className="font-medium text-gray-800 hover:text-purple-600 transition-all duration-200 ease-in-out">
                      {account.username}
                    </p>
                    <p className="text-sm text-gray-500 truncate max-w-[200px]">{account.email}</p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="text-center py-8">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-12 w-12 mx-auto text-gray-400 mb-4 transition-all duration-200 ease-in-out"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <p className="text-gray-500 transition-all duration-200 ease-in-out">
              {searchQuery
                ? "No results found."
                : "Start typing to search for accounts."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchSlider;
