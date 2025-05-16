import { useState, useEffect } from "react";
import api from "../utils/axios";
import { Link } from "react-router-dom";
import { FaUserPlus } from "react-icons/fa";
import { useSlider } from "../contexts/SliderContext";
import { useTheme } from "./Nav";

const SuggestedUsers = () => {
  const { darkMode } = useTheme();
  const { openSearchSlider } = useSlider();
  const [suggestedUsers, setSuggestedUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchSuggestedUsers = async () => {
      try {
        setLoading(true);
        const response = await api.get("/users/suggested");
        setSuggestedUsers(response.data.data);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching suggested users:", error);
        setError("Failed to load suggested users");
        setLoading(false);
      }
    };

    fetchSuggestedUsers();
  }, []);

  const handleSendRequest = async (userId) => {
    try {
      await api.post("/users/connections", { recipientId: userId });

      // Update the UI by removing the user from suggestions
      setSuggestedUsers((prevUsers) =>
        prevUsers.filter((user) => user._id !== userId)
      );
    } catch (error) {
      console.error("Error sending connection request:", error);
      setError("Failed to send connection request");
    }
  };

  if (loading) {
    return (
      <div className={`glass rounded-lg p-6 shadow-lg ${
        darkMode ? "bg-gray-800 bg-opacity-30" : ""
      }`}>
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gradient-to-r from-purple-200 to-red-200 rounded w-3/4"></div>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center space-x-4">
                <div className="rounded-full bg-gradient-to-r from-purple-200 to-red-200 h-10 w-10"></div>
                <div className={`h-4 ${
                  darkMode ? "bg-gray-700" : "bg-gray-200"
                } rounded w-1/2`}></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`glass rounded-lg p-6 shadow-lg ${
        darkMode ? "bg-gray-800 bg-opacity-30" : ""
      }`}>
        <div className="text-center text-red-500">
          <p className="mb-3">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="grad text-white px-4 py-1 rounded-full text-sm"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`glass rounded-lg shadow-lg overflow-hidden ${
      darkMode ? "bg-gray-800 bg-opacity-30" : ""
    }`}>
      <div className="p-4 grad">
        <h2 className="font-bold text-lg text-white flex items-center">
          <FaUserPlus className="mr-2" />
          People You May Know
        </h2>
      </div>

      {suggestedUsers.length > 0 ? (
        <div className="p-4">
          <ul className="space-y-4">
            {suggestedUsers.map((user) => (
              <li
                key={user._id}
                className={`flex items-center justify-between rounded-lg ${
                  darkMode 
                    ? "hover:bg-gray-700" 
                    : "hover:bg-gray-50"
                } p-2 transition-colors`}
              >
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    <img
                      src={
                        user.profilePicture.startsWith("http")
                          ? user.profilePicture
                          : `/uploads/${user.profilePicture}`
                      }
                      alt={user.username}
                      className="w-10 h-10 rounded-full object-cover ring-gradient"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = `https://placehold.co/50/gray/white?text=${user.username
                          .charAt(0)
                          .toUpperCase()}`;
                      }}
                    />
                  </div>
                  <Link
                    to={`/profile/${user._id}`}
                    className={`text-sm font-medium ${
                      darkMode 
                        ? "text-gray-200 hover:text-purple-400" 
                        : "text-gray-800 hover:text-purple-600"
                    } transition-colors`}
                  >
                    {user.username}
                  </Link>
                </div>
                <button
                  onClick={() => handleSendRequest(user._id)}
                  className="grad text-white text-xs font-medium py-1.5 px-3 rounded-full shadow-sm hover:shadow-md transition-all cursor-pointer"
                >
                  Follow
                </button>
              </li>
            ))}
          </ul>

          <div className="mt-4 text-center">
            <button
              onClick={openSearchSlider}
              className={`text-sm ${
                darkMode 
                  ? "text-purple-400 hover:text-purple-300" 
                  : "text-purple-600 hover:text-purple-800"
              } font-medium`}
            >
              Find More People
            </button>
          </div>
        </div>
      ) : (
        <div className="p-6 text-center">
          <p className={`text-sm ${
            darkMode ? "text-gray-400" : "text-gray-500"
          } mb-4`}>
            No suggested users at the moment
          </p>
          <button
            onClick={openSearchSlider}
            className="grad text-white text-sm py-1.5 px-4 rounded-full inline-block shadow-sm hover:shadow-md transition-all"
          >
            Discover People
          </button>
        </div>
      )}
    </div>
  );
};

export default SuggestedUsers;
