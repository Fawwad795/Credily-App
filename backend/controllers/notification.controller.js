import Notification from "../models/notification.model.js";

// Enable debug mode for detailed logging
const DEBUG = false;

// Debug logging helper
const logDebug = (message, data) => {
  if (DEBUG) {
    console.log(`[NotificationController] ${message}`, data || "");
  }
};

// Function to add notification - can be called directly or as a middleware
export const addNotification = async (dataOrReq, res) => {
  try {
    // Determine if this is a direct function call or API route
    const isDirectCall = !res;
    let notificationData;
    let req = null;

    if (isDirectCall) {
      // Direct function call with notification data
      notificationData = dataOrReq;
      logDebug("Direct call to addNotification with data:", {
        recipient: dataOrReq.recipient,
        type: dataOrReq.type,
      });
    } else {
      // API route call with request object
      req = dataOrReq;
      notificationData = dataOrReq.body;
      logDebug("API route call to addNotification with data:", {
        recipient: dataOrReq.body.recipient,
        type: dataOrReq.body.type,
      });
    }

    // Extract notification details
    const {
      recipient,
      sender,
      type,
      title,
      content,
      referenceId,
      referenceModel,
      metadata,
      priority,
    } = notificationData;

    // Validate required fields
    if (!recipient || !type || !title || !content) {
      const errorMsg =
        "Recipient, type, title, and content are required for notifications";
      logDebug("Validation error:", errorMsg);

      if (!isDirectCall) {
        return res.status(400).json({
          success: false,
          message: errorMsg,
        });
      }
      throw new Error(errorMsg);
    }

    // Create the notification
    const notification = await Notification.create({
      recipient,
      sender: sender || null,
      type,
      title,
      content,
      referenceId: referenceId || null,
      referenceModel: referenceModel || null,
      metadata: metadata || {},
      priority: priority || "normal",
    });

    logDebug("Notification created successfully with ID:", notification._id);

    // Get unread count for badge
    const unreadCount = await Notification.countDocuments({
      recipient,
      isRead: false,
    });

    logDebug("Unread count for recipient:", { recipient, count: unreadCount });

    // Emit a socket event for real-time notification
    // Check if we have access to io through req object, or it's passed in notificationData
    const io = (req && req.io) || notificationData.io;
    if (io) {
      // Convert recipient to string to ensure compatibility
      const recipientId = recipient.toString();

      try {
        // First emit the updated unread count for the badge for immediate UI update
        io.to(recipientId).emit("notificationCount", {
          count: unreadCount,
        });

        // Then emit the new notification with full details
        io.to(recipientId).emit("newNotification", notification);

        logDebug(
          `Emitted real-time notification to ${recipientId} with count ${unreadCount}`
        );
      } catch (socketError) {
        console.error("Socket emission error:", socketError);
        logDebug("Failed to emit socket event:", socketError.message);
      }
    } else {
      logDebug("No socket.io instance available for real-time notification");
    }

    if (!isDirectCall) {
      // Only send response if this is an API route call
      return res.status(201).json({
        success: true,
        message: "Notification created successfully.",
        data: notification,
        unreadCount,
      });
    }

    return notification;
  } catch (error) {
    console.error("Error adding notification:", error);
    logDebug("Error in addNotification:", error.message);

    if (!isDirectCall) {
      return res.status(500).json({
        success: false,
        message: "Failed to create notification.",
        error: error.message,
      });
    }

    throw error;
  }
};

// Fetch notifications for a user
export const getUserNotifications = async (req, res) => {
  try {
    const userId = req.user._id; // Using _id instead of id
    const { limit = 20, skip = 0, isRead } = req.query;

    logDebug("Fetching notifications for user:", {
      userId,
      limit,
      skip,
      isRead,
    });

    // Build the filter object
    const filter = { recipient: userId };
    if (isRead !== undefined) {
      filter.isRead = isRead === "true"; // Convert string to boolean
    }

    // Fetch notifications
    const notifications = await Notification.find(filter)
      .sort({ createdAt: -1 })
      .skip(parseInt(skip))
      .limit(parseInt(limit))
      .populate("sender", "username profilePicture")
      .exec();

    const total = await Notification.countDocuments(filter);

    // Get unread count for badge
    const unreadCount = await Notification.countDocuments({
      recipient: userId,
      isRead: false,
    });

    logDebug("Notifications fetched successfully:", {
      count: notifications.length,
      unreadCount,
      total,
    });

    res.status(200).json({
      success: true,
      message: "Notifications fetched successfully.",
      data: {
        notifications,
        unreadCount,
        pagination: {
          total,
          limit: parseInt(limit),
          skip: parseInt(skip),
        },
      },
    });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    logDebug("Error in getUserNotifications:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to fetch notifications.",
      error: error.message,
    });
  }
};

// Mark notifications as read
export const markAsRead = async (req, res) => {
  try {
    const { notificationIds } = req.body;
    const userId = req.user._id;

    logDebug("Marking notifications as read:", { userId, notificationIds });

    if (!notificationIds || !Array.isArray(notificationIds)) {
      logDebug("Invalid request: Notification IDs array is required");
      return res.status(400).json({
        success: false,
        message: "Notification IDs array is required",
      });
    }

    // Update notifications that belong to this user
    const result = await Notification.updateMany(
      {
        _id: { $in: notificationIds },
        recipient: userId,
      },
      { isRead: true }
    );

    logDebug("Notifications marked as read:", {
      modifiedCount: result.modifiedCount,
    });

    // Get updated unread count
    const unreadCount = await Notification.countDocuments({
      recipient: userId,
      isRead: false,
    });

    // If we have io instance, emit updated count
    if (req.io) {
      try {
        const recipientId = userId.toString();
        req.io
          .to(recipientId)
          .emit("notificationCount", { count: unreadCount });
        logDebug("Emitted updated notification count:", {
          recipientId,
          count: unreadCount,
        });
      } catch (socketError) {
        console.error("Socket emission error in markAsRead:", socketError);
      }
    }

    res.status(200).json({
      success: true,
      message: "Notifications marked as read",
      data: {
        modifiedCount: result.modifiedCount,
        unreadCount,
      },
    });
  } catch (error) {
    console.error("Error marking notifications as read:", error);
    logDebug("Error in markAsRead:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to mark notifications as read",
      error: error.message,
    });
  }
};
