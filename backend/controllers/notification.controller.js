import Notification from "../models/notification.model.js";

// Add a new notification
export const addNotification = async (req, res) => {
  try {
    const { recipient, sender, type, title, content, referenceId, referenceModel, metadata, priority } = req.body;

    // Validate required fields
    if (!recipient || !type || !title || !content) {
      return res.status(400).json({
        success: false,
        message: "Recipient, type, title, and content are required.",
      });
    }

    // Create the notification
    const notification = await Notification.create({
      recipient,
      sender: sender || null, // Sender can be null for system notifications
      type,
      title,
      content,
      referenceId: referenceId || null,
      referenceModel: referenceModel || null,
      metadata: metadata || {},
      priority: priority || "normal",
    });

    res.status(201).json({
      success: true,
      message: "Notification created successfully.",
      data: notification,
    });
  } catch (error) {
    console.error("Error adding notification:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create notification.",
      error: error.message,
    });
  }
};

// Fetch notifications for a user
export const getUserNotifications = async (req, res) => {
  try {
    const userId = req.user.id; // Assuming `req.user` contains the authenticated user's ID
    const { limit = 20, skip = 0, isRead } = req.query;

    // Build the filter object
    const filter = {};
    if (isRead !== undefined) {
      filter.isRead = isRead === "true"; // Convert string to boolean
    }

    // Fetch notifications
    const notifications = await Notification.getUserNotifications(userId, parseInt(limit), parseInt(skip), filter);

    res.status(200).json({
      success: true,
      message: "Notifications fetched successfully.",
      data: notifications,
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