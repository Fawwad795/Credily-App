import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null, // Can be null for system notifications
    },
    type: {
      type: String,
      enum: [
        "message",
        "connection_request",
        "connection_accepted",
        "review_received",
        "reputation_update",
        "system",
      ],
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    content: {
      type: String,
      required: true,
      trim: true,
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    referenceId: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: "referenceModel",
      default: null, // ID of the related document (message, review, etc.)
    },
    referenceModel: {
      type: String,
      enum: ["Message", "Conversation", "Connection", "Review", "User", null],
      default: null,
    },
    metadata: {
      type: Map,
      of: mongoose.Schema.Types.Mixed,
      default: {}, // For storing additional data specific to notification type
    },
    priority: {
      type: String,
      enum: ["low", "normal", "high"],
      default: "normal",
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // Default 30 days expiry
    },
  },
  {
    timestamps: true,
  }
);

// Create indexes for efficient querying
notificationSchema.index({ recipient: 1, createdAt: -1 }); // For retrieving user's notifications by date
notificationSchema.index({ recipient: 1, isRead: 1 }); // For filtering read/unread notifications
notificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL index for automatic deletion

// Static method to get user's notifications with pagination
notificationSchema.statics.getUserNotifications = async function (
  userId,
  limit = 20,
  skip = 0,
  filter = {}
) {
  const query = { recipient: userId, ...filter };

  return this.find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate("sender", "username profilePicture")
    .populate("referenceId");
};

// Static method to mark notifications as read
notificationSchema.statics.markAsRead = async function (
  notificationIds,
  userId
) {
  return this.updateMany(
    {
      _id: { $in: notificationIds },
      recipient: userId,
      isRead: false,
    },
    { $set: { isRead: true } }
  );
};

// Static method to mark all notifications as read for a user
notificationSchema.statics.markAllAsRead = async function (userId) {
  return this.updateMany(
    { recipient: userId, isRead: false },
    { $set: { isRead: true } }
  );
};

// Static method to get unread count for a user
notificationSchema.statics.getUnreadCount = async function (userId) {
  return this.countDocuments({ recipient: userId, isRead: false });
};

// Static method to create a new message notification
notificationSchema.statics.createMessageNotification = async function (
  recipientId,
  senderId,
  conversationId,
  messagePreview
) {
  const sender = await mongoose.model("User").findById(senderId, "username");

  return this.create({
    recipient: recipientId,
    sender: senderId,
    type: "message",
    title: "New Message",
    content: `${sender.username}: ${messagePreview}`,
    referenceId: conversationId,
    referenceModel: "Conversation",
    metadata: {
      conversationId: conversationId.toString(),
    },
  });
};

// Static method to create a new connection request notification
notificationSchema.statics.createConnectionRequestNotification =
  async function (recipientId, senderId, connectionId) {
    const sender = await mongoose.model("User").findById(senderId, "username");

    return this.create({
      recipient: recipientId,
      sender: senderId,
      type: "connection_request",
      title: "Connection Request",
      content: `${sender.username} sent you a connection request`,
      referenceId: connectionId,
      referenceModel: "Connection",
      priority: "high",
    });
  };

const Notification = mongoose.model("Notification", notificationSchema);

export default Notification;
