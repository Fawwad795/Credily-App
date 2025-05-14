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
      className={`fixed top-0 right-0 h-full bg-white shadow-lg transform ${
        isOpen ? "translate-x-0" : "translate-x-full"
      } transition-transform duration-300 z-50 w-full sm:w-96 md:w-1/3 lg:w-1/4`}
    >
      {/* Header */}
      <div className="p-4 border-b flex justify-between items-center">
        <h2 className="text-lg font-bold">Search Accounts</h2>
        <button
          onClick={onClose} // Close the slider
          className="text-gray-500 hover:text-gray-700"
        >
          Close
        </button>
      </div>

      {/* Search Input Wrapper with Gradient */}
      <div className="p-4">
        <div className="grad p-0.5 rounded-lg shadow-sm">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search for accounts..."
            className="w-full px-4 py-2 border-transparent rounded-md focus:outline-none focus:ring-0 text-white placeholder-white bg-transparent"
          />
        </div>
      </div>

      {/* Search Results */}
      <div className="p-4 overflow-y-auto" style={{maxHeight: 'calc(100vh - 160px)'}}> {/* Adjust 160px based on header/input height */}
        {loading ? (
          <p className="text-center py-4">Loading...</p>
        ) : results.length > 0 ? (
          <ul className="bg-white divide-y divide-gray-200 rounded-lg border border-gray-200">
            {results.map((account) => (
              <li
                key={account._id}
                className="p-3 hover:bg-gray-50 cursor-pointer transition-colors duration-150"
                onClick={() => handleProfileClick(account._id)}
              >
                <div className="flex items-center gap-3">
                  <img
                    src={
                      account.profilePicture ||
                      generatePlaceholderAvatar(account.username)
                    }
                    alt={account.username || "Profile"}
                    className="w-10 h-10 rounded-full object-cover bg-gray-200"
                    onError={(e) => handleImageError(e, account.username)}
                  />
                  <div>
                    <p className="font-semibold text-gray-800">{account.username}</p>
                    <p className="text-sm text-gray-500">{account.email}</p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-500 text-center py-4">
            {searchQuery.trim()
              ? "No results found."
              : "Start typing to search for accounts."}
          </p>
        )}
      </div>
    </div>
  );
};

export default SearchSlider;
