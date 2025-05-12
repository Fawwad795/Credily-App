import { useState, useEffect } from "react";
import axios from "axios";

const Notifications = ({ isOpen, onClose }) => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  // Generate placeholder avatar for profile pictures
  const generatePlaceholderAvatar = (sender) => {
    const initial = sender?.username
      ? sender.username.charAt(0).toUpperCase()
      : "U";
    return `https://placehold.co/50/teal/white?text=${initial}`;
  };

  // Handle image error by replacing with placeholder
  const handleImageError = (e, sender) => {
    e.target.onerror = null; // Prevent infinite callbacks
    e.target.src = generatePlaceholderAvatar(sender);
  };

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const response = await axios.get("/api/notifications");
        setNotifications(response.data.data);
      } catch (error) {
        console.error("Error fetching notifications:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
  }, []);

  useEffect(() => {
    const fetchUnreadCount = async () => {
      try {
        const response = await axios.get("/api/notifications/unread-count");
        setUnreadCount(response.data.count);
      } catch (error) {
        console.error("Error fetching unread count:", error);
      }
    };

    fetchUnreadCount();
  }, []);

  const markAsRead = async (notificationId) => {
    try {
      await axios.post(`/api/notifications/${notificationId}/mark-as-read`);
      setNotifications((prev) =>
        prev.filter((notification) => notification._id !== notificationId)
      );
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  const connectionNotifications = notifications.filter(
    (notification) =>
      notification.type === "connection_request" ||
      notification.type === "connection_accepted"
  );

  return (
    <div
      className={`fixed top-0 right-0 h-full w-80 bg-white shadow-lg transform transition-transform duration-300 ${
        isOpen ? "translate-x-0" : "translate-x-full"
      }`}
    >
      <div className="p-4 border-b flex justify-between items-center">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-bold">Notifications</h2>
          {unreadCount > 0 && (
            <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full">
              {unreadCount}
            </span>
          )}
        </div>
        <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
          Close
        </button>
      </div>
      <div className="p-4 overflow-y-auto h-full">
        {loading ? (
          <p>Loading...</p>
        ) : connectionNotifications.length === 0 ? (
          <p>No connection-related notifications.</p>
        ) : (
          <ul>
            {connectionNotifications.map((notification) => (
              <li
                key={notification._id}
                className="p-4 border-b cursor-pointer flex gap-3 items-start"
                onClick={() => markAsRead(notification._id)}
              >
                <img
                  src={
                    notification.sender?.profilePicture ||
                    generatePlaceholderAvatar(notification.sender)
                  }
                  alt="profile"
                  className="w-10 h-10 rounded-full object-cover"
                  onError={(e) => handleImageError(e, notification.sender)}
                />
                <div>
                  <h3 className="font-bold">{notification.title}</h3>
                  <p>{notification.content}</p>
                  <small className="text-gray-500">
                    {new Date(notification.createdAt).toLocaleString()}
                  </small>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default Notifications;
