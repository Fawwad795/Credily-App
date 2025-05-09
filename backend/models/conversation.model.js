import mongoose from "mongoose";

const conversationSchema = new mongoose.Schema(
  {
    participants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
    ],
    title: {
      type: String,
      trim: true,
      default: null, // Optional, mainly for group chats
    },
    lastMessage: {
      text: String,
      sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      timestamp: {
        type: Date,
        default: Date.now,
      },
    },
    unreadCounts: {
      type: Map,
      of: Number,
      default: {}, // Maps userId to number of unread messages
    },
    status: {
      type: String,
      enum: ["active", "archived"],
      default: "active",
    },
    metadata: {
      type: Map,
      of: mongoose.Schema.Types.Mixed,
      default: {}, // For storing additional data like whether conversation is related to specific connection/review
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Create indexes for efficient queries
conversationSchema.index({ participants: 1 }); // For finding user's conversations
conversationSchema.index({ participants: 1, updatedAt: -1 }); // For sorting conversations by latest activity
conversationSchema.index({ status: 1 }); // For filtering active/archived conversations

// Static method to find a conversation between two users
conversationSchema.statics.findOneOnOneConversation = async function (
  userId1,
  userId2
) {
  return this.findOne({
    participants: { $all: [userId1, userId2], $size: 2 },
  });
};

// Static method to get all conversations for a user
conversationSchema.statics.findUserConversations = async function (
  userId,
  limit = 20,
  skip = 0
) {
  return this.find({ participants: userId })
    .sort({ updatedAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate("participants", "username profilePicture")
    .populate("lastMessage.sender", "username profilePicture");
};

// Static method to increment unread count for a participant
conversationSchema.statics.incrementUnreadCount = async function (
  conversationId,
  userId
) {
  const conversation = await this.findById(conversationId);
  if (!conversation) return null;

  // Get current unread count or default to 0
  const currentCount = conversation.unreadCounts.get(userId.toString()) || 0;

  // Set the new count for this user
  conversation.unreadCounts.set(userId.toString(), currentCount + 1);
  return conversation.save();
};

// Static method to reset unread count for a participant
conversationSchema.statics.resetUnreadCount = async function (
  conversationId,
  userId
) {
  return this.findByIdAndUpdate(
    conversationId,
    { $set: { [`unreadCounts.${userId}`]: 0 } },
    { new: true }
  );
};

const Conversation = mongoose.model("Conversation", conversationSchema);

export default Conversation;
