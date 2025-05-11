import { useState, useEffect } from "react";
import axios from "axios";

const Notifications = ({ isOpen, onClose }) => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

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
        <h2 className="text-lg font-bold">Notifications</h2>
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
                className="p-4 border-b cursor-pointer"
                onClick={() => markAsRead(notification._id)}
              >
                <h3 className="font-bold">{notification.title}</h3>
                <p>{notification.content}</p>
                <small className="text-gray-500">
                  {new Date(notification.createdAt).toLocaleString()}
                </small>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default Notifications;