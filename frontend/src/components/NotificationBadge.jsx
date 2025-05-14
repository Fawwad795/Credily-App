import React, { useState, useEffect, useCallback, useRef } from "react";
import socketClient from "../utils/socket.js";
import api from "../utils/axios";
import { jwtDecode } from "jwt-decode";

const NotificationBadge = ({ onClick, customStyle = "" }) => {
  const [unreadCount, setUnreadCount] = useState(0);
  const [isConnected, setIsConnected] = useState(false);
  const [lastNotification, setLastNotification] = useState(null);
  const joinedRoom = useRef(false);
  const roomId = useRef(null);
  const socketRef = useRef(socketClient);

  // Parse JWT token to get user ID - extracted as a reusable function
  const getUserIdFromToken = useCallback(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      return null;
    }

    try {
      const payload = token.split(".")[1];
      if (!payload) {
        return null;
      }

      const decoded = jwtDecode(token);
      const userId = decoded.id || decoded._id || decoded.userId || decoded.sub;

      if (userId) {
        return userId;
      } else {
        return null;
      }
    } catch (error) {
      console.error("Error parsing JWT token:", error);
      return null;
    }
  }, []);

  // Join user's notification room
  const joinNotificationRoom = useCallback(() => {
    const userId = getUserIdFromToken();
    if (!userId) {
      return false;
    }

    if (!socketRef.current || !socketRef.current.connected) {
      return false;
    }

    if (joinedRoom.current && roomId.current === userId) {
      return true;
    }

    socketRef.current.emit("joinRoom", userId);
    joinedRoom.current = true;
    roomId.current = userId;
    return true;
  }, [getUserIdFromToken]);

  // Fetch unread notifications count
  const fetchUnreadCount = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        return;
      }

      const response = await api.get("/notifications?isRead=false", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.data?.data?.unreadCount !== undefined) {
        const count = response.data.data.unreadCount;
        setUnreadCount(count);
      } else if (response.data?.data?.notifications) {
        // Fallback: count notifications if unreadCount not provided directly
        const count = response.data.data.notifications.length;
        setUnreadCount(count);
      }
    } catch (error) {
      console.error("Error fetching unread notifications:", error);
    }
  }, []);

  // Force reconnect socket if needed
  const ensureSocketConnection = useCallback(() => {
    if (socketRef.current && !socketRef.current.connected) {
      socketRef.current.connect();
    }
  }, []);

  useEffect(() => {
    // Ensure we have latest socket instance
    socketRef.current = socketClient;

    // Initial connection attempt
    ensureSocketConnection();

    // Fetch initial notification count
    fetchUnreadCount();

    // Handle connection events
    const handleConnect = () => {
      setIsConnected(true);
      joinNotificationRoom();
      // Immediately fetch counts when connected
      fetchUnreadCount();
    };

    const handleDisconnect = () => {
      setIsConnected(false);
      joinedRoom.current = false;
      // Try to reconnect immediately
      setTimeout(() => {
        ensureSocketConnection();
      }, 1000);
    };

    // Handle notification count updates
    const handleNotificationCount = ({ count }) => {
      setUnreadCount(count);
    };

    // Handle new notification
    const handleNewNotification = (notification) => {
      // Increment the count for new notifications
      setUnreadCount((prev) => prev + 1);
      // Save last notification for display
      setLastNotification(notification);
      // Also fetch actual count to ensure accuracy
      fetchUnreadCount();
    };

    // Set up event listeners
    socketRef.current.on("connect", handleConnect);
    socketRef.current.on("disconnect", handleDisconnect);
    socketRef.current.on("notificationCount", handleNotificationCount);
    socketRef.current.on("newNotification", handleNewNotification);

    // Check initial connection state
    if (socketRef.current.connected) {
      setIsConnected(true);
      joinNotificationRoom();
    }

    // Setup more frequent room joining to ensure we're connected
    const joinInterval = setInterval(() => {
      if (socketRef.current.connected && !joinedRoom.current) {
        joinNotificationRoom();
      } else if (!socketRef.current.connected) {
        ensureSocketConnection();
      }
    }, 1000); // Check more frequently (1 second instead of 2)

    // Setup periodic refresh of notification count
    const refreshInterval = setInterval(() => {
      fetchUnreadCount();
    }, 10000); // More frequent refresh (10 seconds instead of 15)

    // Cleanup function
    return () => {
      socketRef.current.off("connect", handleConnect);
      socketRef.current.off("disconnect", handleDisconnect);
      socketRef.current.off("notificationCount", handleNotificationCount);
      socketRef.current.off("newNotification", handleNewNotification);
      clearInterval(joinInterval);
      clearInterval(refreshInterval);
    };
  }, [
    fetchUnreadCount,
    getUserIdFromToken,
    joinNotificationRoom,
    ensureSocketConnection,
  ]);

  // Display tooltip with notification info when hovering
  const getTooltipText = () => {
    if (!lastNotification) return "New notifications";

    if (lastNotification.type === "connection_request") {
      return "New connection request";
    } else if (lastNotification.type === "connection_accepted") {
      return "Connection accepted";
    } else if (lastNotification.type === "connection_rejected") {
      return "Connection declined";
    } else {
      return lastNotification.title || "New notification";
    }
  };

  // Determine the badge color based on connection status and custom style
  const getBadgeClasses = () => {
    if (customStyle) {
      return customStyle;
    }
    return isConnected ? "bg-red-500 text-white" : "bg-gray-400 text-white";
  };

  return (
    <div className="relative group">
      {unreadCount > 0 && (
        <div
          className={`${getBadgeClasses()} rounded-full flex items-center justify-center text-xs min-w-[18px] h-[18px] px-1 cursor-pointer transition-all duration-300 hover:scale-110 shadow-sm`}
          onClick={onClick}
        >
          {unreadCount > 99 ? "99+" : unreadCount}
        </div>
      )}

      {/* Tooltip that appears on hover */}
      {unreadCount > 0 && (
        <div className="absolute hidden group-hover:block top-5 right-0 bg-gray-800 text-white text-xs rounded py-1 px-2 whitespace-nowrap z-10">
          {getTooltipText()}
        </div>
      )}
    </div>
  );
};

export default NotificationBadge;
