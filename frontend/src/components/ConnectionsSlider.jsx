import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../utils/axios";

const ConnectionsSlider = ({ isOpen, onClose, userId }) => {
  const [connections, setConnections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (isOpen && userId) {
      console.log("ConnectionsSlider opened with userId:", userId);
      fetchConnections(userId);
    }
  }, [isOpen, userId]);

  const fetchConnections = async (userId) => {
    try {
      setLoading(true);
      console.log("Fetching connections for userId:", userId);
      
      const response = await api.get(`/users/${userId || 'me'}/connections`);
      console.log("Connections API response:", response.data);
      
      if (response.data && response.data.success) {
        // Extract the connectionUsers array from the data object
        const connectionUsers = response.data.data?.connectionUsers || [];
        console.log("Setting connections:", connectionUsers);
        setConnections(connectionUsers);
      } else {
        console.log("API response success is false or undefined");
        setConnections([]);
      }
      setError(null);
    } catch (error) {
      console.error("Error fetching connections:", error);
      setError("Failed to load connections");
    } finally {
      setLoading(false);
    }
  };

  // Navigate to user profile when clicked
  const handleProfileClick = (userId) => {
    navigate(`/profile/${userId}`);
    onClose(); // Close the connections slider
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
        <h2 className="text-lg font-bold">Connections</h2>
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

      {/* Connections List */}
      <div className="p-4 overflow-y-auto max-h-[calc(100vh-4rem)] scrollbar-thin scrollbar-thumb-purple-200 scrollbar-track-transparent">
        {loading ? (
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
          </div>
        ) : error ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 mx-auto bg-red-100 text-red-500 rounded-full flex items-center justify-center mb-4">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-8 w-8"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <p className="text-red-500">{error}</p>
          </div>
        ) : connections.length > 0 ? (
          <ul className="space-y-2">
            {connections.map((connection) => (
              <li
                key={connection._id}
                className="p-3 rounded-xl hover:bg-gray-50 cursor-pointer transition-all duration-200 ease-in-out border border-gray-100 hover:shadow-md hover:border-purple-100"
                onClick={() => handleProfileClick(connection._id)}
              >
                <div className="flex items-center gap-3">
                  <img
                    src={
                      connection.profilePicture ||
                      generatePlaceholderAvatar(connection.username)
                    }
                    alt="Profile"
                    className="w-10 h-10 rounded-full object-cover ring-2 ring-purple-200 transition-all duration-200 ease-in-out hover:ring-purple-400"
                    onError={(e) => handleImageError(e, connection.username)}
                  />
                  <div>
                    <p className="font-medium text-gray-800 hover:text-purple-600 transition-all duration-200 ease-in-out">
                      {connection.username}
                    </p>
                    <p className="text-sm text-gray-500 truncate max-w-[200px]">
                      {connection.email}
                    </p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="text-center py-8">
            <div className="w-16 h-16 mx-auto bg-gray-100 text-gray-400 rounded-full flex items-center justify-center mb-4">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-8 w-8"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                />
              </svg>
            </div>
            <p className="text-gray-500">No connections found</p>
            <p className="text-sm text-gray-400 mt-2">
              Connect with other users to see them here
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ConnectionsSlider; 