import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import SearchSlider from "../pages/SearchPage";
import "../index.css"; // Updated path to reference index.css in the src directory
import api from "../utils/axios";
import NotificationBadge from "./NotificationBadge";
import NavNotificationButton from "./NavNotificationButton";

// Define a Back Arrow SVG
const BackArrowIcon = () => (
  <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
  </svg>
);

// Existing XIcon (example, taken from your Nav.jsx structure for the close button)
const XIcon = () => (
  <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
  </svg>
);

// Existing MenuIcon (example, taken from your Nav.jsx structure for the hamburger button)
const MenuIcon = () => (
  <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
  </svg>
);

// Loading Screen Component
const LoadingScreen = ({ message }) => {
  return (
    <div className="fixed inset-0 bg-white bg-opacity-95 flex flex-col items-center justify-center z-50">
      <div className="flex space-x-3 mb-5">
        <div
          className="w-4 h-4 rounded-full grad animate-bounce shadow-md"
          style={{ animationDelay: "0ms" }}
        ></div>
        <div
          className="w-4 h-4 rounded-full grad animate-bounce shadow-md"
          style={{ animationDelay: "200ms" }}
        ></div>
        <div
          className="w-4 h-4 rounded-full grad animate-bounce shadow-md"
          style={{ animationDelay: "400ms" }}
        ></div>
      </div>
      <p className="text-gray-700 font-medium text-lg">{message}</p>
    </div>
  );
};

const Notifications = ({ isOpen, onClose }) => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [connectionStatuses, setConnectionStatuses] = useState({});
  const [activeTab, setActiveTab] = useState("all");

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

        // Fetch connection statuses for all connection request notifications
        const connectionRequestNotifs = notificationsData.filter(
          (notification) => notification.type === "connection_request"
        );

        if (connectionRequestNotifs.length > 0) {
          await fetchConnectionStatuses(connectionRequestNotifs);
        }
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

  // New function to fetch connection statuses for connection requests
  const fetchConnectionStatuses = async (connectionNotifs) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const statuses = {};

      // For each connection request notification, fetch the current status
      for (const notification of connectionNotifs) {
        if (notification.referenceId) {
          try {
            const response = await api.get(
              `/users/connections/${notification.referenceId}`,
              {
                headers: {
                  Authorization: `Bearer ${token}`,
                },
              }
            );

            if (response.data && response.data.success) {
              statuses[notification.referenceId] = response.data.data.status;
            }
          } catch (error) {
            console.error(
              `Error fetching connection status for ${notification.referenceId}:`,
              error
            );
          }
        }
      }

      setConnectionStatuses(statuses);
    } catch (error) {
      console.error("Error fetching connection statuses:", error);
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

      // Find the original notification to get the username
      const originalNotification = notifications.find(
        (n) => n.referenceId === connectionId && n.type === "connection_request"
      );

      // Extract username from content (typically in format "username has sent you a connection request")
      let usernameToInclude = "";
      if (originalNotification && originalNotification.content) {
        const contentParts = originalNotification.content.split(" has sent");
        if (contentParts.length > 0) {
          usernameToInclude = contentParts[0];
        }
      }

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
        // Update the connection status in state
        setConnectionStatuses((prev) => ({
          ...prev,
          [connectionId]: "accepted",
        }));

        // Update the notification type
        setNotifications((prev) =>
          prev.map((notification) => {
            if (notification.referenceId === connectionId) {
              return {
                ...notification,
                type: "connection_accepted",
                title: "Connection Accepted",
                content: usernameToInclude
                  ? `You accepted ${usernameToInclude}'s connection request.`
                  : `You accepted the connection request.`,
                timestamp: new Date().toISOString(),
              };
            }
            return notification;
          })
        );

        // Reload the notifications to get the latest status
        setTimeout(() => {
          fetchNotifications();
        }, 500);
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

      // Find the original notification to get the username
      const originalNotification = notifications.find(
        (n) => n.referenceId === connectionId && n.type === "connection_request"
      );

      // Extract username from content (typically in format "username has sent you a connection request")
      let usernameToInclude = "";
      if (originalNotification && originalNotification.content) {
        const contentParts = originalNotification.content.split(" has sent");
        if (contentParts.length > 0) {
          usernameToInclude = contentParts[0];
        }
      }

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
        // Update the connection status in state
        setConnectionStatuses((prev) => ({
          ...prev,
          [connectionId]: "rejected",
        }));

        // Update the notification type
        setNotifications((prev) =>
          prev.map((notification) => {
            if (notification.referenceId === connectionId) {
              return {
                ...notification,
                type: "connection_rejected",
                title: "Connection Rejected",
                content: usernameToInclude
                  ? `You declined ${usernameToInclude}'s connection request.`
                  : `You declined the connection request.`,
                timestamp: new Date().toISOString(),
              };
            }
            return notification;
          })
        );

        // Reload the notifications to get the latest status
        setTimeout(() => {
          fetchNotifications();
        }, 500);
      }
    } catch (error) {
      console.error("Error rejecting connection request:", error);
      alert("Failed to reject connection request. Please try again.");
    }
  };

  // Filter notifications by type - update to show all connection requests
  const connectionRequestNotifications = notifications.filter(
    (notification) =>
      notification.type === "connection_request" &&
      // Only include notifications where connection is still pending or status is unknown
      (!notification.referenceId ||
        !connectionStatuses[notification.referenceId] ||
        connectionStatuses[notification.referenceId] === "pending")
  );

  const connectionAcceptedNotifications = notifications.filter(
    (notification) =>
      notification.type === "connection_accepted" ||
      (notification.type === "connection_request" &&
        notification.referenceId &&
        connectionStatuses[notification.referenceId] === "accepted")
  );

  const connectionRejectedNotifications = notifications.filter(
    (notification) =>
      notification.type === "connection_rejected" ||
      (notification.type === "connection_request" &&
        notification.referenceId &&
        connectionStatuses[notification.referenceId] === "rejected")
  );

  const otherNotifications = notifications.filter(
    (notification) =>
      notification.type !== "connection_request" &&
      notification.type !== "connection_accepted" &&
      notification.type !== "connection_rejected"
  );

  // All notifications to display based on active tab
  const displayedNotifications =
    activeTab === "all"
      ? notifications
      : activeTab === "requests"
      ? connectionRequestNotifications
      : activeTab === "accepted"
      ? connectionAcceptedNotifications
      : activeTab === "other"
      ? [...otherNotifications, ...connectionRejectedNotifications]
      : [];

  // Count unread notifications
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  // Debug log to check notification state
  console.log("Current notifications state:", notifications);
  console.log("Connection statuses:", connectionStatuses);

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

  const refreshNotifications = () => {
    fetchNotifications();
  };

  // Get the icon based on notification type
  const getNotificationIcon = (notificationType) => {
    switch (notificationType) {
      case "connection_request":
        return (
          <div className="w-8 h-8 rounded-full flex items-center justify-center bg-blue-100 text-blue-600">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
              <circle cx="9" cy="7" r="4"></circle>
              <path d="M22 21v-2a4 4 0 0 0-3-3.87"></path>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
            </svg>
          </div>
        );
      case "connection_accepted":
        return (
          <div className="w-8 h-8 rounded-full flex items-center justify-center bg-green-100 text-green-600">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
              <polyline points="22 4 12 14.01 9 11.01"></polyline>
            </svg>
          </div>
        );
      case "connection_rejected":
        return (
          <div className="w-8 h-8 rounded-full flex items-center justify-center bg-red-100 text-red-600">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="15" y1="9" x2="9" y2="15"></line>
              <line x1="9" y1="9" x2="15" y2="15"></line>
            </svg>
          </div>
        );
      case "message":
        return (
          <div className="w-8 h-8 rounded-full flex items-center justify-center bg-purple-100 text-purple-600">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
            </svg>
          </div>
        );
      default:
        return (
          <div className="w-8 h-8 rounded-full flex items-center justify-center bg-gray-100 text-gray-600">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="16" x2="12" y2="12"></line>
              <line x1="12" y1="8" x2="12.01" y2="8"></line>
            </svg>
          </div>
        );
    }
  };

  return (
    <div
      className={`fixed top-0 right-0 h-full w-80 bg-white shadow-xl transform transition-transform duration-300 z-[101] pointer-events-auto ${
        isOpen ? "translate-x-0" : "translate-x-full"
      }`}
      style={{ zIndex: 101 }}
    >
      {/* Header with gradient */}
      <div className="grad p-4 text-white flex justify-between items-center shadow-md">
        <div>
          <h2 className="text-lg font-bold flex items-center">
            Notifications
            {unreadCount > 0 && (
              <span className="ml-2 bg-white text-blue-600 text-xs rounded-full h-5 w-5 flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </h2>
        </div>
        <div className="flex items-center">
          <button
            onClick={refreshNotifications}
            className="text-white hover:text-gray-200 mr-3"
            title="Refresh"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M23 4v6h-6"></path>
              <path d="M1 20v-6h6"></path>
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10"></path>
              <path d="M20.49 15a9 9 0 0 1-14.85 3.36L1 14"></path>
            </svg>
          </button>
          <button
            onClick={onClose}
            className="text-white hover:text-gray-200"
            title="Close"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex border-b text-sm">
        <button
          className={`flex-1 py-2 px-3 font-medium ${
            activeTab === "all"
              ? "text-blue-600 border-b-2 border-blue-600"
              : "text-gray-600 hover:bg-gray-50"
          }`}
          onClick={() => setActiveTab("all")}
        >
          All
        </button>
        <button
          className={`flex-1 py-2 px-3 font-medium flex items-center justify-center ${
            activeTab === "requests"
              ? "text-blue-600 border-b-2 border-blue-600"
              : "text-gray-600 hover:bg-gray-50"
          }`}
          onClick={() => setActiveTab("requests")}
        >
          Requests
          {connectionRequestNotifications.length > 0 && (
            <span className="ml-1 bg-blue-100 text-blue-600 text-xs rounded-full h-5 w-5 flex items-center justify-center">
              {connectionRequestNotifications.length}
            </span>
          )}
        </button>
        <button
          className={`flex-1 py-2 px-3 font-medium ${
            activeTab === "accepted"
              ? "text-blue-600 border-b-2 border-blue-600"
              : "text-gray-600 hover:bg-gray-50"
          }`}
          onClick={() => setActiveTab("accepted")}
        >
          Accepted
        </button>
        <button
          className={`flex-1 py-2 px-3 font-medium ${
            activeTab === "other"
              ? "text-blue-600 border-b-2 border-blue-600"
              : "text-gray-600 hover:bg-gray-50"
          }`}
          onClick={() => setActiveTab("other")}
        >
          Other
        </button>
      </div>

      <div className="overflow-y-auto h-[calc(100%-8rem)]">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-full">
            <div className="flex space-x-2 mb-3">
              <div
                className="w-3 h-3 bg-blue-600 rounded-full animate-bounce"
                style={{ animationDelay: "0s" }}
              ></div>
              <div
                className="w-3 h-3 bg-blue-600 rounded-full animate-bounce"
                style={{ animationDelay: "0.2s" }}
              ></div>
              <div
                className="w-3 h-3 bg-blue-600 rounded-full animate-bounce"
                style={{ animationDelay: "0.4s" }}
              ></div>
            </div>
            <p className="text-gray-500 text-sm">Loading notifications...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center h-full">
            <div className="w-12 h-12 rounded-full flex items-center justify-center bg-red-100 text-red-500 mb-3">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
            </div>
            <p className="text-red-500">{error}</p>
          </div>
        ) : displayedNotifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-6">
            <div className="w-16 h-16 rounded-full flex items-center justify-center bg-gray-100 text-gray-400 mb-4">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="28"
                height="28"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
              </svg>
            </div>
            <p className="text-gray-500 mb-1">No notifications to display</p>
            <p className="text-gray-400 text-sm">You're all caught up!</p>
          </div>
        ) : (
          <div className="py-2">
            {/* Notifications list */}
            {displayedNotifications.map((notification) => (
              <div
                key={notification._id}
                className={`p-3 mx-2 my-1.5 rounded-lg transition-all duration-200 ${
                  notification.isRead ? "bg-white" : "bg-blue-50"
                } hover:bg-gray-50 border border-gray-100 shadow-sm`}
                onClick={() => markNotificationAsRead(notification._id)}
              >
                <div className="flex">
                  {/* Icon based on notification type */}
                  {getNotificationIcon(notification.type)}

                  <div className="ml-3 flex-1">
                    <h4 className="font-medium text-gray-900 text-sm">
                      {notification.title}
                      {!notification.isRead && (
                        <span className="inline-block ml-2 w-2 h-2 rounded-full bg-blue-600"></span>
                      )}
                    </h4>
                    <p className="text-gray-600 text-sm mt-0.5">
                      {notification.content}
                    </p>

                    {/* Connection request action buttons */}
                    {notification.type === "connection_request" &&
                      (!notification.referenceId ||
                        !connectionStatuses[notification.referenceId] ||
                        connectionStatuses[notification.referenceId] ===
                          "pending") && (
                        <div className="flex space-x-2 mt-2.5">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAcceptRequest(notification.referenceId);
                            }}
                            className="px-3 py-1.5 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white text-xs font-medium rounded shadow-sm flex-1 flex items-center justify-center"
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="12"
                              height="12"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              className="mr-1"
                            >
                              <polyline points="20 6 9 17 4 12"></polyline>
                            </svg>
                            Accept
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRejectRequest(notification.referenceId);
                            }}
                            className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-medium rounded flex-1 flex items-center justify-center"
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="12"
                              height="12"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              className="mr-1"
                            >
                              <line x1="18" y1="6" x2="6" y2="18"></line>
                              <line x1="6" y1="6" x2="18" y2="18"></line>
                            </svg>
                            Decline
                          </button>
                        </div>
                      )}

                    <div className="flex justify-between items-center mt-1.5">
                      <small className="text-gray-400 text-xs">
                        {new Date(
                          notification.timestamp || notification.createdAt
                        ).toLocaleString("en-US", {
                          month: "short",
                          day: "numeric",
                          hour: "numeric",
                          minute: "numeric",
                        })}
                      </small>

                      {notification.type === "connection_accepted" && (
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full ${
                            notification.content.includes("You accepted")
                              ? "bg-gradient-to-r from-green-500 to-green-600 text-white font-medium"
                              : "bg-green-50 text-green-600"
                          }`}
                        >
                          {notification.content.includes("You accepted")
                            ? "Accepted"
                            : "Accepted"}
                        </span>
                      )}

                      {notification.type === "connection_rejected" && (
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full ${
                            notification.content.includes("You declined")
                              ? "bg-gradient-to-r from-red-500 to-red-600 text-white font-medium"
                              : "bg-red-50 text-red-600"
                          }`}
                        >
                          {notification.content.includes("You declined")
                            ? "Declined"
                            : "Declined"}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const Nav = ({ isChatViewActive, onChatBackClick }) => {
  const [activeSlider, setActiveSlider] = useState(null); // 'search' or 'notifications'
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false); // State for mobile menu
  const [isOverlayRendered, setIsOverlayRendered] = useState(false); // New state for delayed overlay rendering

  useEffect(() => {
    let timerId;
    if (isMobileMenuOpen && !isChatViewActive) { // Only manage overlay if menu should open and not in chat view mode
      timerId = setTimeout(() => {
        setIsOverlayRendered(true);
      }, 50); // 50ms delay - adjust if needed
    } else {
      setIsOverlayRendered(false); // Hide immediately if menu is closing or in chat view mode
    }
    return () => clearTimeout(timerId);
  }, [isMobileMenuOpen, isChatViewActive]);

  const [activeItem, setActiveItem] = useState(() => {
    // Determine active item based on current path
    const path = window.location.pathname;
    if (path.includes("/profile")) return "profile";
    if (path.includes("/messages")) return "messages";
    if (path.includes("/search")) return "search";
    return "home";
  });

  const handleSignout = async () => {
    setIsLoading(true);

    try {
      // Call the signout API
      await fetch("/api/users/signout", {
        method: "POST",
        credentials: "include", // Include cookies if used
      });
      localStorage.removeItem("token"); // Changed "user" to "token"
      alert("Signed out successfully!");
      window.location.href = "/login"; // Redirect to login page
    } catch (error) {
      console.error("Error signing out:", error);
      setIsLoading(false);
      // Show error in a non-modal way, such as toast notification
      // For now just log to console
    }
  };

  const handleMenuItemClick = (item) => {
    setActiveItem(item);
    setIsMobileMenuOpen(false); // Close mobile menu on item click
  };

  const handleSliderToggle = (sliderName) => {
    setActiveSlider(sliderName);
    setActiveItem(sliderName); // Set active item to match slider
    setIsMobileMenuOpen(false); // Close mobile menu when a slider opens (this will also hide overlay via useEffect)
  };
  
  // Simplified closeMobileMenu or use inline for overlay click
  const handleOverlayClick = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <>
      {/* Mobile top-left button: Back Arrow or Hamburger/Close */}
      {isChatViewActive ? (
        <button
          onClick={onChatBackClick}
          className="sm:hidden fixed top-4 left-4 z-50 p-2 rounded-full text-gray-700 bg-white shadow-md hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-purple-500"
          aria-label="Back to chat list"
        >
          <BackArrowIcon />
        </button>
      ) : (
        <button
          onClick={() => setIsMobileMenuOpen(prev => !prev)} // Simplified onClick
          className={`sm:hidden fixed top-4 z-50 p-2 rounded-md text-gray-700 bg-white shadow-md hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-purple-500 ${isMobileMenuOpen ? 'right-4' : 'left-4'}`}
          aria-label={isMobileMenuOpen ? "Close sidebar" : "Open sidebar"}
        >
          {isMobileMenuOpen ? <XIcon /> : <MenuIcon />}
        </button>
      )}

      {/* Overlay for mobile menu (only if not in chat view and conditions from useEffect met) */}
      {isOverlayRendered && (
        <div
          className="sm:hidden fixed inset-0 bg-black bg-opacity-50 z-30 transition-opacity duration-150 ease-in-out"
          onClick={handleOverlayClick} // Use new handler or inline setIsMobileMenuOpen(false)
          aria-hidden="true"
        ></div>
      )}

      {/* Sidebar */}
      <aside
        id="default-sidebar"
        className={`fixed top-0 left-0 z-40 h-screen bg-white shadow-lg transition-transform duration-300 ease-in-out ${(!isChatViewActive && isMobileMenuOpen) ? "w-full translate-x-0" : "w-full -translate-x-full"} sm:w-64 sm:translate-x-0 sm:shadow-lg`}
        aria-label="Sidebar"
      >
        <div className="h-full flex flex-col overflow-y-auto">
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
                onClick={() => handleMenuItemClick("profile")}
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
                onClick={() => handleMenuItemClick("home")}
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
                onClick={() => handleSliderToggle("search")}
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
                onClick={() => handleMenuItemClick("messages")}
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
                onClick={() => handleSliderToggle("notifications")}
                className={`w-full flex items-center p-3 rounded-lg transition-all duration-200 cursor-pointer ${
                  activeItem === "notifications"
                    ? "grad text-white shadow-md"
                    : "text-gray-700 hover:bg-gradient-to-r hover:from-purple-50 hover:to-red-50"
                }`}
              >
                <NavNotificationButton
                  isActive={activeItem === "notifications"}
                  onClick={() => {
                    setActiveSlider("notifications");
                    setActiveItem("notifications");
                  }}
                />
                <span className="ms-3 font-medium">Notifications</span>
              </button>
            </li>
          </ul>

          <div className="mt-auto p-3">
            <button
              onClick={() => {
                handleSignout();
                setIsMobileMenuOpen(false); // Close menu on signout
              }}
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
