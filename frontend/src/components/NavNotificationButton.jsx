import React from "react";
import NotificationBadge from "./NotificationBadge";

/**
 * A notification button component specifically designed for navigation
 * Includes the notification icon and badge in one component
 */
const NavNotificationButton = ({ isActive = false, onClick }) => {
  return (
    <div className="flex items-center justify-center">
      <div className="relative">
        {/* Notification bell icon */}
        <svg
          className={`w-5 h-5 ${
            isActive ? "text-white" : "text-gray-500"
          } transition duration-150`}
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

        {/* Notification badge */}
        <div className="absolute top-0 right-0 transform translate-x-1/2 -translate-y-1/2">
          <NotificationBadge
            onClick={(e) => {
              e.stopPropagation(); // Prevent double triggering
              if (onClick) onClick(e);
            }}
            customStyle={isActive ? "bg-white text-purple-600" : ""}
          />
        </div>
      </div>
    </div>
  );
};

export default NavNotificationButton;
