import mongoose from "mongoose";

const connectionSchema = new mongoose.Schema(
  {
    requester: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "accepted", "rejected", "blocked"],
      default: "pending",
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

// Compound index to ensure uniqueness of connections
connectionSchema.index({ requester: 1, recipient: 1 }, { unique: true });

// Index for faster lookups by each user
connectionSchema.index({ requester: 1, status: 1 });
connectionSchema.index({ recipient: 1, status: 1 });

// Static method to check if two users are connected
connectionSchema.statics.areConnected = async function (userId1, userId2) {
  const connection = await this.findOne({
    $or: [
      { requester: userId1, recipient: userId2, status: "accepted" },
      { requester: userId2, recipient: userId1, status: "accepted" },
    ],
  });

  return !!connection;
};

// Static method to find mutual connections between two users
connectionSchema.statics.findMutualConnections = async function (
  userId1,
  userId2
) {
  // Get all connections for user1
  const user1Connections = await this.find({
    $or: [
      { requester: userId1, status: "accepted" },
      { recipient: userId1, status: "accepted" },
    ],
  });

  // Extract all connected user IDs for user1
  const user1ConnectionIds = user1Connections.map((conn) => {
    return String(conn.requester) === String(userId1)
      ? String(conn.recipient)
      : String(conn.requester);
  });

  // Get all connections for user2
  const user2Connections = await this.find({
    $or: [
      { requester: userId2, status: "accepted" },
      { recipient: userId2, status: "accepted" },
    ],
  });

  // Extract all connected user IDs for user2
  const user2ConnectionIds = user2Connections.map((conn) => {
    return String(conn.requester) === String(userId2)
      ? String(conn.recipient)
      : String(conn.requester);
  });

  // Find mutual connections (intersection)
  const mutualConnectionIds = user1ConnectionIds.filter((id) =>
    user2ConnectionIds.includes(id)
  );

  return mutualConnectionIds;
};

const Connection = mongoose.model("Connection", connectionSchema);

export default Connection;
