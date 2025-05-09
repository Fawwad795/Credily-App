import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    receiver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
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
    attachments: [{
      type: String, // URLs to attachments
    }],
    messageType: {
      type: String,
      enum: ["text", "image", "file"],
      default: "text",
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster querying of conversations
messageSchema.index({ sender: 1, receiver: 1, createdAt: -1 });

const Message = mongoose.model("Message", messageSchema);

export default Message; 
import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    conversation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Conversation",
      required: true,
      index: true,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    content: {
      type: String,
      required: true,
      trim: true,
    },
    messageType: {
      type: String,
      enum: ["text", "system", "media"],
      default: "text",
    },
    readStatus: {
      type: Map,
      of: Date,
      default: {}, // Maps userId to timestamp when they read the message
    },
    attachments: [
      {
        type: String, // URLs to media files
        default: [],
      },
    ],
    reactions: {
      type: Map,
      of: Number,
      default: {}, // Maps reaction type to count (e.g., "like": 5, "love": 2)
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Create indexes for efficient querying
messageSchema.index({ conversation: 1, createdAt: -1 }); // For retrieving conversation messages in chronological order
messageSchema.index({ sender: 1 }); // For finding messages by sender
messageSchema.index({ createdAt: 1 }); // For general chronological queries

// Static method to get paginated messages for a conversation
messageSchema.statics.getConversationMessages = async function (
  conversationId,
  limit = 50,
  before = null
) {
  let query = { conversation: conversationId, isDeleted: false };

  // If 'before' timestamp is provided, get messages before that time
  if (before) {
    query.createdAt = { $lt: new Date(before) };
  }

  return this.find(query)
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate("sender", "username profilePicture");
};

// Static method to mark messages as read by a user
messageSchema.statics.markAsRead = async function (
  conversationId,
  userId,
  before = null
) {
  const currentTime = new Date();
  let query = {
    conversation: conversationId,
    // Only mark messages that aren't from this user and haven't been read yet
    sender: { $ne: userId },
    [`readStatus.${userId}`]: { $exists: false },
  };

  // If 'before' timestamp is provided, only mark messages before that time
  if (before) {
    query.createdAt = { $lte: new Date(before) };
  }

  // Mark messages as read with the current timestamp
  return this.updateMany(query, {
    $set: { [`readStatus.${userId}`]: currentTime },
  });
};

// Static method to get unread message count for a user in a conversation
messageSchema.statics.getUnreadCount = async function (conversationId, userId) {
  return this.countDocuments({
    conversation: conversationId,
    sender: { $ne: userId },
    [`readStatus.${userId}`]: { $exists: false },
    isDeleted: false,
  });
};

// Method to check if a message is read by all participants
messageSchema.methods.isReadByAll = function (participantIds) {
  const readByIds = Object.keys(this.readStatus.toObject());
  return participantIds.every(
    (id) =>
      id.toString() === this.sender.toString() || // Sender automatically "read" it
      readByIds.includes(id.toString())
  );
};

const Message = mongoose.model("Message", messageSchema);

export default Message;
