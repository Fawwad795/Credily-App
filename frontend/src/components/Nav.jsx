import { Link } from "react-router-dom";
import SearchSlider from "../pages/SearchPage";
import "../index.css"; // Updated path to reference index.css in the src directory
import { useState, useEffect } from "react";
import api from "../utils/axios";

const Notifications = ({ isOpen, onClose }) => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");

      if (!token) {
        setError("Not authenticated");
        setLoading(false);
        return;
      }

      const response = await api.get("/notifications", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.data && response.data.data) {
        // Check if notifications property exists in the response data structure
        const notificationsData =
          response.data.data.notifications || response.data.data;
        setNotifications(notificationsData);
      } else {
        setNotifications([]);
      }
      setError(null);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      setError("Failed to load notifications");
    } finally {
      setLoading(false);
    }
  };

  // Add this useEffect to mark all notifications as read when panel is opened and notifications are loaded
  useEffect(() => {
    const markAllAsRead = async () => {
      if (isOpen && notifications.length > 0) {
        console.log(
          "Notifications panel opened with",
          notifications.length,
          "notifications"
        );

        // Find all unread notification IDs
        const unreadIds = notifications
          .filter((notification) => !notification.isRead)
          .map((notification) => notification._id);

        console.log(
          "Found",
          unreadIds.length,
          "unread notifications:",
          unreadIds
        );

        if (unreadIds.length === 0) {
          console.log("No unread notifications to mark");
          return;
        }

        // Get token
        const token = localStorage.getItem("token");
        if (!token) {
          console.error("No token available");
          return;
        }

        try {
          console.log("Sending API request to mark notifications as read...");

          // Make the API call
          const response = await api.post(
            `/notifications/mark-read`,
            { notificationIds: unreadIds },
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );

          console.log("API Response:", response.data);

          if (response.data.success) {
            console.log("Successfully marked notifications as read");

            // Update local state
            setNotifications((prev) =>
              prev.map((notification) =>
                unreadIds.includes(notification._id)
                  ? { ...notification, isRead: true }
                  : notification
              )
            );
          } else {
            console.error("API returned success: false");
          }
        } catch (error) {
          console.error(
            "Error marking notifications as read:",
            error.response?.data || error.message
          );
        }
      }
    };

    // Call the function
    if (isOpen && notifications.length > 0) {
      markAllAsRead();
    }
  }, [isOpen, notifications]);

  const handleAcceptRequest = async (connectionId) => {
    try {
      const token = localStorage.getItem("token");

      if (!token) return;

      const response = await api.put(
        `/users/connections/${connectionId}/accept`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data && response.data.success) {
        // Instead of removing the notification, update its type and content
        setNotifications((prev) =>
          prev.map((notification) => {
            if (notification.referenceId === connectionId) {
              return {
                ...notification,
                type: "connection_accepted",
                title: "Connection Accepted",
                content: `You accepted the connection request.`,
                timestamp: new Date().toISOString(),
              };
            }
            return notification;
          })
        );
      }
    } catch (error) {
      console.error("Error accepting connection request:", error);
      alert("Failed to accept connection request. Please try again.");
    }
  };

  const handleRejectRequest = async (connectionId) => {
    try {
      const token = localStorage.getItem("token");

      if (!token) return;

      // Use the dedicated reject endpoint
      const response = await api.put(
        `/users/connections/${connectionId}/reject`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data && response.data.success) {
        // Instead of removing the notification, update its type and content
        setNotifications((prev) =>
          prev.map((notification) => {
            if (notification.referenceId === connectionId) {
              return {
                ...notification,
                type: "connection_rejected",
                title: "Connection Rejected",
                content: `You rejected the connection request.`,
                timestamp: new Date().toISOString(),
              };
            }
            return notification;
          })
        );
      }
    } catch (error) {
      console.error("Error rejecting connection request:", error);
      alert("Failed to reject connection request. Please try again.");
    }
  };

  // Filter notifications by type - update to show all connection requests
  const connectionRequestNotifications = notifications.filter(
    (notification) => notification.type === "connection_request"
  );

  const connectionAcceptedNotifications = notifications.filter(
    (notification) => notification.type === "connection_accepted"
  );

  const connectionRejectedNotifications = notifications.filter(
    (notification) => notification.type === "connection_rejected"
  );

  const otherNotifications = notifications.filter(
    (notification) =>
      notification.type !== "connection_request" &&
      notification.type !== "connection_accepted" &&
      notification.type !== "connection_rejected"
  );

  // Debug log to check notification state
  console.log("Current notifications state:", notifications);
  console.log(
    "Connection request notifications:",
    connectionRequestNotifications.map((n) => ({ id: n._id, isRead: n.isRead }))
  );

  // Add a function to manually mark a single notification as read
  const markNotificationAsRead = async (notificationId) => {
    try {
      console.log("Marking single notification as read:", notificationId);
      const token = localStorage.getItem("token");
      if (!token) return;

      const response = await api.post(
        `/notifications/mark-read`,
        { notificationIds: [notificationId] },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      console.log("Manual mark as read response:", response.data);

      // Only update UI if the API call was successful
      if (response.data.success) {
        setNotifications((prev) =>
          prev.map((notification) =>
            notification._id === notificationId
              ? { ...notification, isRead: true }
              : notification
          )
        );
      }
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  return (
    <div
      className={`fixed top-0 right-0 h-full w-80 bg-white shadow-lg transform transition-transform duration-300 z-[101] pointer-events-auto ${
        isOpen ? "translate-x-0" : "translate-x-full"
      }`}
      style={{ zIndex: 101 }}
    >
      <div className="p-4 border-b flex justify-between items-center">
        <h2 className="text-lg font-bold">Notifications</h2>
        <button
          onClick={onClose}
          className="text-gray-500 hover:text-gray-700 cursor-pointer"
        >
          Close
        </button>
      </div>
      <div className="p-4 overflow-y-auto h-full">
        {loading ? (
          <p>Loading notifications...</p>
        ) : error ? (
          <p className="text-red-500">{error}</p>
        ) : notifications.length === 0 ? (
          <p>No notifications yet.</p>
        ) : (
          <div>
            {/* Connection Request Notifications with Accept/Reject buttons */}
            {connectionRequestNotifications.length > 0 && (
              <div className="mb-6">
                <h3 className="font-bold mb-2 text-green-800">
                  Connection Requests
                </h3>
                <ul>
                  {connectionRequestNotifications.map((notification) => (
                    <li
                      key={notification._id}
                      className={`p-3 border rounded-lg mb-2 ${
                        notification.isRead ? "bg-gray-50" : "bg-green-50"
                      }`}
                      onClick={() => markNotificationAsRead(notification._id)}
                    >
                      <h4 className="font-semibold">{notification.title}</h4>
                      <p className="mb-2">{notification.content}</p>
                      <div className="flex justify-between mt-2 pointer-events-auto">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAcceptRequest(notification.referenceId);
                          }}
                          className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 relative z-[102] cursor-pointer"
                        >
                          Accept
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRejectRequest(notification.referenceId);
                          }}
                          className="px-3 py-1 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 relative z-[102] cursor-pointer"
                        >
                          Reject
                        </button>
                      </div>
                      <small className="text-gray-500 block mt-2">
                        {new Date(notification.createdAt).toLocaleString()}
                      </small>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Connection Accepted Notifications */}
            {connectionAcceptedNotifications.length > 0 && (
              <div className="mb-6">
                <h3 className="font-bold mb-2 text-green-800">
                  Accepted Connections
                </h3>
                <ul>
                  {connectionAcceptedNotifications.map((notification) => (
                    <li
                      key={notification._id}
                      className={`p-3 border rounded-lg mb-2 ${
                        notification.isRead ? "bg-gray-50" : "bg-green-100"
                      }`}
                    >
                      <h4 className="font-semibold">{notification.title}</h4>
                      <p className="mb-2">{notification.content}</p>
                      <small className="text-gray-500 block mt-2">
                        {new Date(
                          notification.timestamp || notification.createdAt
                        ).toLocaleString()}
                      </small>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Connection Rejected Notifications */}
            {connectionRejectedNotifications.length > 0 && (
              <div className="mb-6">
                <h3 className="font-bold mb-2 text-red-800">
                  Rejected Connections
                </h3>
                <ul>
                  {connectionRejectedNotifications.map((notification) => (
                    <li
                      key={notification._id}
                      className={`p-3 border rounded-lg mb-2 ${
                        notification.isRead ? "bg-gray-50" : "bg-red-50"
                      }`}
                    >
                      <h4 className="font-semibold">{notification.title}</h4>
                      <p className="mb-2">{notification.content}</p>
                      <small className="text-gray-500 block mt-2">
                        {new Date(
                          notification.timestamp || notification.createdAt
                        ).toLocaleString()}
                      </small>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Other Notifications */}
            {otherNotifications.length > 0 && (
              <div>
                <h3 className="font-bold mb-2 text-gray-800">
                  Other Notifications
                </h3>
                <ul>
                  {otherNotifications.map((notification) => (
                    <li
                      key={notification._id}
                      className={`p-3 border rounded-lg mb-2 ${
                        notification.isRead ? "bg-gray-50" : "bg-blue-50"
                      }`}
                    >
                      <h4 className="font-semibold">{notification.title}</h4>
                      <p>{notification.content}</p>
                      <small className="text-gray-500 block mt-2">
                        {new Date(notification.createdAt).toLocaleString()}
                      </small>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

const Nav = () => {
  const [activeSlider, setActiveSlider] = useState(null); // 'search' or 'notifications'
  const [activeItem, setActiveItem] = useState(() => {
    // Determine active item based on current path
    const path = window.location.pathname;
    if (path.includes("/profile")) return "profile";
    if (path.includes("/messages")) return "messages";
    if (path.includes("/search")) return "search";
    return "home";
  });

  const handleSignout = async () => {
    try {
      await fetch("/api/users/signout", {
        method: "POST",
        credentials: "include", // Include cookies if used
      });
      localStorage.removeItem("user"); // Clear user data from local storage
      alert("Signed out successfully!");
      window.location.href = "/login"; // Redirect to login page
    } catch (error) {
      console.error("Error signing out:", error);
      alert("Failed to sign out. Please try again.");
    }
  };

  return (
    <>
      {/* Sidebar */}
      <aside
        id="default-sidebar"
        className="fixed top-0 left-0 z-40 w-64 h-screen transition-transform -translate-x-full sm:translate-x-0 shadow-lg"
        aria-label="Sidebar"
      >
        <div className="h-full flex flex-col overflow-y-auto bg-white">
          {/* Gradient header */}
          <div className="grad p-5 pb-6 text-white rounded-b-xl mb-2 shadow-md">
            <h2 className="text-2xl font-bold font-handsome tracking-wide">
              Credily
            </h2>
            <p className="text-xs opacity-80">Building trust online</p>
          </div>

          <ul className="space-y-1 p-3 font-medium">
            <li>
              <Link
                to="/profile"
                className={`flex items-center p-3 rounded-lg transition-all duration-200 cursor-pointer ${
                  activeItem === "profile"
                    ? "grad text-white shadow-md"
                    : "text-gray-700 hover:bg-gradient-to-r hover:from-purple-50 hover:to-red-50"
                }`}
                onClick={() => setActiveItem("profile")}
              >
                <svg
                  className={`w-5 h-5 ${
                    activeItem === "profile" ? "text-white" : "text-gray-500"
                  } transition duration-75`}
                  aria-hidden="true"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  strokeWidth="2"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
                <span className="ms-3 font-medium">Profile</span>
              </Link>
            </li>
            <li>
              <Link
                to="/home"
                className={`flex items-center p-3 rounded-lg transition-all duration-200 cursor-pointer ${
                  activeItem === "home"
                    ? "grad text-white shadow-md"
                    : "text-gray-700 hover:bg-gradient-to-r hover:from-purple-50 hover:to-red-50"
                }`}
                onClick={() => setActiveItem("home")}
              >
                <svg
                  className={`w-5 h-5 ${
                    activeItem === "home" ? "text-white" : "text-gray-500"
                  } transition duration-75`}
                  aria-hidden="true"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  strokeWidth="2"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                  />
                </svg>
                <span className="ms-3 font-medium">Home</span>
              </Link>
            </li>
            <li>
              <button
                onClick={() => {
                  setActiveSlider("search");
                  setActiveItem("search");
                }}
                className={`w-full flex items-center p-3 rounded-lg transition-all duration-200 cursor-pointer ${
                  activeItem === "search"
                    ? "grad text-white shadow-md"
                    : "text-gray-700 hover:bg-gradient-to-r hover:from-purple-50 hover:to-red-50"
                }`}
              >
                <svg
                  className={`w-5 h-5 ${
                    activeItem === "search" ? "text-white" : "text-gray-500"
                  } transition duration-75`}
                  aria-hidden="true"
                  xmlns="http://www.w3.org/2000/svg"
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
                <span className="ms-3 font-medium">Search</span>
              </button>
            </li>
            <li>
              <Link
                to="/messages"
                className={`flex items-center p-3 rounded-lg transition-all duration-200 cursor-pointer ${
                  activeItem === "messages"
                    ? "grad text-white shadow-md"
                    : "text-gray-700 hover:bg-gradient-to-r hover:from-purple-50 hover:to-red-50"
                }`}
                onClick={() => setActiveItem("messages")}
              >
                <svg
                  className={`w-5 h-5 ${
                    activeItem === "messages" ? "text-white" : "text-gray-500"
                  } transition duration-75`}
                  aria-hidden="true"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  strokeWidth="2"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                  />
                </svg>
                <span className="ms-3 font-medium">Messages</span>
              </Link>
            </li>

            {/* Notifications Button */}
            <li>
              <button
                onClick={() => {
                  setActiveSlider("notifications");
                  setActiveItem("notifications");
                }}
                className={`w-full flex items-center p-3 rounded-lg transition-all duration-200 cursor-pointer ${
                  activeItem === "notifications"
                    ? "grad text-white shadow-md"
                    : "text-gray-700 hover:bg-gradient-to-r hover:from-purple-50 hover:to-red-50"
                }`}
              >
                <svg
                  className={`w-5 h-5 ${
                    activeItem === "notifications"
                      ? "text-white"
                      : "text-gray-500"
                  } transition duration-75`}
                  aria-hidden="true"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  strokeWidth="2"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                  />
                </svg>
                <span className="ms-3 font-medium">Notifications</span>
              </button>
            </li>
          </ul>

          <div className="mt-auto p-3">
            <button
              onClick={handleSignout}
              className="w-full flex items-center p-3 rounded-lg text-gray-700 hover:bg-gradient-to-r hover:from-purple-50 hover:to-red-50 transition-all duration-200 cursor-pointer"
            >
              <svg
                className="w-5 h-5 text-gray-500"
                aria-hidden="true"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                strokeWidth="2"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                />
              </svg>
              <span className="ms-3 font-medium">Sign Out</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Search Slider */}
      <SearchSlider
        isOpen={activeSlider === "search"}
        onClose={() => setActiveSlider(null)}
      />

      {/* Notifications Slider */}
      <Notifications
        isOpen={activeSlider === "notifications"}
        onClose={() => setActiveSlider(null)}
      />
    </>
  );
};

export default Nav;
