import Notification from "../models/notification.model.js";

// Function to add notification - can be called directly or as a middleware
export const addNotification = async (dataOrReq, res) => {
  try {
    // Determine if this is a direct function call or API route
    const isDirectCall = !res;
    let notificationData;

    if (isDirectCall) {
      // Direct function call with notification data
      notificationData = dataOrReq;
    } else {
      // API route call with request object
      notificationData = dataOrReq.body;
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

    if (!isDirectCall) {
      // Only send response if this is an API route call
      return res.status(201).json({
        success: true,
        message: "Notification created successfully.",
        data: notification,
      });
    }

    return notification;
  } catch (error) {
    console.error("Error adding notification:", error);

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

    res.status(200).json({
      success: true,
      message: "Notifications fetched successfully.",
      data: {
        notifications,
        pagination: {
          total,
          limit: parseInt(limit),
          skip: parseInt(skip),
        },
      },
    });
  } catch (error) {
    console.error("Error fetching notifications:", error);
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

    if (!notificationIds || !Array.isArray(notificationIds)) {
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

    res.status(200).json({
      success: true,
      message: "Notifications marked as read",
      data: { modifiedCount: result.modifiedCount },
    });
  } catch (error) {
    console.error("Error marking notifications as read:", error);
    res.status(500).json({
      success: false,
      message: "Failed to mark notifications as read",
      error: error.message,
    });
  }
};
