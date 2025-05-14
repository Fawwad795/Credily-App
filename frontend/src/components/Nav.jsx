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
        <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
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
                          className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 relative z-[102]"
                        >
                          Accept
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRejectRequest(notification.referenceId);
                          }}
                          className="px-3 py-1 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 relative z-[102]"
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
        className="fixed color top-0 left-0 z-40 w-64 h-screen transition-transform -translate-x-full sm:translate-x-0"
        aria-label="Sidebar"
      >
        <div className="h-full px-3 py-4 color overflow-y-auto bg-white dark:bg-gray-800">
          <ul className="space-y-2 font-medium">
            <li>
              <Link
                to="/home"
                className="flex items-center p-2 text-gray-900 rounded-lg dark:text-white hover:bg-green-100 dark:hover:bg-green-700 group"
              >
                <svg
                  className="w-5 h-5 text-gray-500 transition duration-75 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white"
                  aria-hidden="true"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z"></path>
                </svg>
                <span className="ms-3 text-gray-900">Home</span>
              </Link>
            </li>
            <li>
              <Link
                to="/profile"
                className="flex items-center p-2 text-gray-900 rounded-lg dark:text-white hover:bg-green-100 dark:hover:bg-green-700 group"
              >
                <svg
                  className="w-5 h-5 text-gray-500 transition duration-75 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white"
                  aria-hidden="true"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="currentColor"
                  viewBox="0 0 22 21"
                >
                  <path d="M16.975 11H10V4.025a1 1 0 0 0-1.066-.998 8.5 8.5 0 1 0 9.039 9.039.999.999 0 0 0-1-1.066h.002Z" />
                  <path d="M12.5 0c-.157 0-.311.01-.565.027A1 1 0 0 0 11 1.02V10h8.975a1 1 0 0 0 1-.935c.013-.188.028-.374.028-.565A8.51 8.51 0 0 0 12.5 0Z" />
                </svg>
                <span className="ms-3 text-gray-900">Profile</span>
              </Link>
            </li>
            <li>
              <button
                onClick={() => setActiveSlider("search")}
                className="w-full flex items-center p-2 text-gray-900 rounded-lg dark:text-white hover:bg-green-100 dark:hover:bg-green-700 group"
              >
                <svg
                  className="w-5 h-5 text-gray-500 transition duration-75 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white"
                  aria-hidden="true"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="currentColor"
                  viewBox="0 0 18 18"
                >
                  <path d="M6.143 0H1.857A1.857 1.857 0 0 0 0 1.857v4.286C0 7.169.831 8 1.857 8h4.286A1.857 1.857 0 0 0 8 6.143V1.857A1.857 1.857 0 0 0 6.143 0Zm10 0h-4.286A1.857 1.857 0 0 0 10 1.857v4.286C10 7.169 10.831 8 11.857 8h4.286A1.857 1.857 0 0 0 18 6.143V1.857A1.857 1.857 0 0 0 16.143 0Zm-10 10H1.857A1.857 1.857 0 0 0 0 11.857v4.286C0 17.169.831 18 1.857 18h4.286A1.857 1.857 0 0 0 8 16.143v-4.286A1.857 1.857 0 0 0 6.143 10Zm10 0h-4.286A1.857 1.857 0 0 0 10 11.857v4.286c0 1.026.831 1.857 1.857 1.857h4.286A1.857 1.857 0 0 0 18 16.143v-4.286A1.857 1.857 0 0 0 16.143 10Z" />
                </svg>
                <span className="ms-3 text-gray-900 group-hover:text-gray-900 dark:group-hover:text-white">
                  Search
                </span>
              </button>
            </li>
            <li>
              <Link
                to="/messages"
                className="flex items-center p-2 text-gray-900 rounded-lg dark:text-white hover:bg-gray-100 dark:hover:bg-green-700 group"
              >
                <svg
                  className="shrink-0 w-5 h-5 text-gray-500 transition duration-75 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white"
                  aria-hidden="true"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="m17.418 3.623-.018-.008a6.713 6.713 0 0 0-2.4-.569V2h1a1 1 0 1 0 0-2h-2a1 1 0 0 0-1 1v2H9.89A6.977 6.977 0 0 1 12 8v5h-2V8A5 5 0 1 0 0 8v6a1 1 0 0 0 1 1h8v4a1 1 0 0 0 1 1h2a1 1 0 0 0 1-1v-4h6a1 1 0 0 0 1-1V8a5 5 0 0 0-2.582-4.377ZM6 12H4a1 1 0 0 1 0-2h2a1 1 0 0 1 0 2Z" />
                </svg>
                <span className="flex-1 ms-3 whitespace-nowrap text-gray-900">
                  Inbox
                </span>
                <span className="inline-flex items-center justify-center w-6 h-6 text-sm font-medium text-green-800 bg-green-200 rounded-full">
                  3
                </span>
              </Link>
            </li>

            {/* Notifications Button */}
            <li>
              <button
                onClick={() => setActiveSlider("notifications")}
                className="w-full flex items-center p-2 text-gray-900 rounded-lg dark:text-white hover:bg-green-100 dark:hover:bg-green-700 group"
              >
                <svg
                  className="shrink-0 w-5 h-5 text-gray-500 transition duration-75 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white"
                  aria-hidden="true"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M14 2a3.963 3.963 0 0 0-1.4.267 6.439 6.439 0 0 1-1.331 6.638A4 4 0 1 0 14 2Zm1 9h-1.264A6.957 6.957 0 0 1 15 15v2a2.97 2.97 0 0 1-.184 1H19a1 1 0 0 0 1-1v-1a5.006 5.006 0 0 0-5-5ZM6.5 9a4.5 4.5 0 1 0 0-9 4.5 4.5 0 0 0 0 9ZM8 10H5a5.006 5.006 0 0 0-5 5v2a1 1 0 0 0 1 1h11a1 1 0 0 0 1-1v-2a5.006 5.006 0 0 0-5-5Z" />
                </svg>
                <span className="ms-3 whitespace-nowrap text-gray-900">
                  Notifications
                </span>
                <span className="inline-flex items-center justify-center w-6 h-6 text-sm font-medium text-green-800 bg-green-200 rounded-full">
                  3
                </span>
              </button>
            </li>

            <li>
              <button
                onClick={handleSignout}
                className="flex items-center p-2 text-gray-900 rounded-lg dark:text-white hover:bg-green-100 dark:hover:bg-green-700 group"
              >
                <svg
                  className="shrink-0 w-5 h-5 text-gray-500 transition duration-75 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white"
                  aria-hidden="true"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 18 16"
                >
                  <path
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M1 8h11m0 0L8 4m4 4-4 4m4-11h3a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2h-3"
                  />
                </svg>
                <span className="flex-1 ms-3 whitespace-nowrap text-gray-900">
                  Sign Out
                </span>
              </button>
            </li>
          </ul>
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
