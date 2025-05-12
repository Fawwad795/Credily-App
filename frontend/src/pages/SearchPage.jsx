import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const SearchSlider = ({ isOpen, onClose }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

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
  }, [searchQuery]);

  // Search API call
  const handleSearch = () => {
    if (!searchQuery.trim()) return;

    setLoading(true);
    const token =
      localStorage.getItem("authToken") || localStorage.getItem("token");

    fetch(`/api/users/search?query=${searchQuery}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    })
      .then((response) => response.json())
      .then((data) => {
        setResults(data.data || []);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error fetching search results:", error);
        setLoading(false);
      });
  };

  // Navigate to user profile when clicked
  const handleProfileClick = (userId) => {
    navigate(`/profile/${userId}`);
    onClose(); // Close the search slider
  };

  return (
    <div
      className={`fixed top-0 right-0 h-full w-1/4 bg-white shadow-lg transform ${
        isOpen ? "translate-x-0" : "translate-x-full"
      } transition-transform duration-300 z-50`}
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

      {/* Search Input */}
      <div className="p-4">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search for accounts..."
          className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:grad"
        />
      </div>

      {/* Search Results */}
      <div className="p-4">
        {loading ? (
          <p className="text-center py-4">Loading...</p>
        ) : results.length > 0 ? (
          <ul className="bg-white shadow-md rounded-lg">
            {results.map((account) => (
              <li
                key={account._id}
                className="p-4 border-b last:border-b-0 hover:bg-gray-100 cursor-pointer"
                onClick={() => handleProfileClick(account._id)}
              >
                <div className="flex items-center gap-3">
                  <img
                    src={account.profilePicture || "/default-avatar.png"}
                    alt="Profile"
                    className="w-10 h-10 rounded-full object-cover"
                  />
                  <div>
                    <p className="font-bold">{account.username}</p>
                    <p className="text-sm text-gray-600">{account.email}</p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-500 text-center">
            {searchQuery
              ? "No results found."
              : "Start typing to search for accounts."}
          </p>
        )}
      </div>
    </div>
  );
};

export default SearchSlider;
