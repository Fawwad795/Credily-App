import User from "../models/user.model.js";
import jwt from "jsonwebtoken";
import Connection from "../models/connection.model.js";
import fs from "fs";
import path from "path";
import { addNotification } from "./notification.controller.js"; // Import the notification function

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: "30d",
  });
};

// Register a new user
export const registerUser = async (req, res) => {
  try {
    const { username, phoneNumber, password } = req.body;

    if (!username || !phoneNumber || !password) {
      return res.status(400).json({
        success: false,
        message: "Username, phone number and password are required",
      });
    }

    // Check if username already exists
    const usernameExists = await User.findOne({ username });
    if (usernameExists) {
      return res.status(400).json({
        success: false,
        message: "Username is already taken",
      });
    }

    // Check if phone number already exists
    const phoneExists = await User.findOne({ phoneNumber });
    if (phoneExists) {
      return res.status(400).json({
        success: false,
        message: "Phone number is already registered",
      });
    }

    // Create new user
    const user = await User.create({
      username,
      password,
      phoneNumber,
    });

    // Generate token
    const token = generateToken(user._id);

    // Return user data without password
    const userData = {
      _id: user._id,
      username: user.username,
      phoneNumber: user.phoneNumber,
      isVerified: user.isVerified,
    };

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      data: userData,
      token,
    });
  } catch (error) {
    console.error("Error registering user:", error);
    res.status(500).json({
      success: false,
      message: "Registration failed",
      error: error.message,
    });
  }
};

// Login user
export const loginUser = async (req, res) => {
  try {
    const { username, password } = req.body;

    // Check if user exists
    const user = await User.findOne({ username }).select("+password");
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Account does not exist",
        error: "no_account",
      });
    }

    // Check if password is correct
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Password incorrect",
        error: "invalid_password",
      });
    }

    // Generate token
    const token = generateToken(user._id);

    // Return user data without password
    const userData = {
      _id: user._id,
      username: user.username,
      phoneNumber: user.phoneNumber,
      isVerified: user.isVerified,
    };

    res.status(200).json({
      success: true,
      message: "Login successful",
      data: userData,
      token,
    });
  } catch (error) {
    console.error("Error logging in:", error);
    res.status(500).json({
      success: false,
      message: "Login failed",
      error: error.message,
    });
  }
};

// Get user profile by ID
export const getUserProfile = async (req, res) => {
  try {
    const userId = req.params.id;
    const user = await User.findById(userId).select("-password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error("Error fetching user profile:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch user profile",
      error: error.message,
    });
  }
};

// Update user profile
export const updateUserProfile = async (req, res) => {
  try {
    const userId = req.params.id;
    const updateData = req.body;

    // Remove sensitive fields from update data
    delete updateData.password;
    delete updateData.isVerified;

    const user = await User.findByIdAndUpdate(
      userId,
      { $set: updateData },
      { new: true, runValidators: true }
    ).select("-password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      data: user,
    });
  } catch (error) {
    console.error("Error updating user profile:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update profile",
      error: error.message,
    });
  }
};

// Search users
export const searchUsers = async (req, res) => {
  try {
    const { query, limit = 10, page = 1 } = req.query;

    const searchQuery = {
      $or: [
        { username: { $regex: query, $options: "i" } },
        { email: { $regex: query, $options: "i" } },
        { phoneNumber: { $regex: query, $options: "i" } },
      ],
    };

    const users = await User.find(searchQuery)
      .select("-password")
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit))
      .sort({ createdAt: -1 });

    const total = await User.countDocuments(searchQuery);

    res.status(200).json({
      success: true,
      data: {
        users,
        pagination: {
          total,
          page: parseInt(page),
          pages: Math.ceil(total / parseInt(limit)),
        },
      },
    });
  } catch (error) {
    console.error("Error searching users:", error);
    res.status(500).json({
      success: false,
      message: "Failed to search users",
      error: error.message,
    });
  }
};

// Search users by username
export const searchUsersByUsername = async (req, res) => {
  try {
    const { query } = req.query; // Get the search query from the request
    const currentUserId = req.user._id; // Get the current user's ID from the request

    if (!query) {
      return res.status(400).json({
        success: false,
        message: "Query parameter is required.",
      });
    }

    // Perform a case-insensitive search for usernames, excluding the current user
    const users = await User.find({
      username: { $regex: query, $options: "i" }, // Case-insensitive regex search
      _id: { $ne: currentUserId }, // Exclude the current user
    }).select("username email profilePicture"); // Select only necessary fields

    res.status(200).json({
      success: true,
      message: "Users fetched successfully.",
      data: users,
    });
  } catch (error) {
    console.error("Error searching users:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch users.",
      error: error.message,
    });
  }
};

// Get users by reputation score
export const getTopUsers = async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    const users = await User.find()
      .select("-password")
      .sort({ reputationScore: -1 })
      .limit(parseInt(limit));

    res.status(200).json({
      success: true,
      data: users,
    });
  } catch (error) {
    console.error("Error fetching top users:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch top users",
      error: error.message,
    });
  }
};

// Update user's last active timestamp
export const updateLastActive = async (req, res) => {
  try {
    const userId = req.params.id;

    const user = await User.findByIdAndUpdate(
      userId,
      { lastActive: new Date() },
      { new: true }
    ).select("-password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Last active timestamp updated",
    });
  } catch (error) {
    console.error("Error updating last active:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update last active timestamp",
      error: error.message,
    });
  }
};

// Get total connections for a user
export const getTotalConnections = async (req, res) => {
  try {
    const userId = req.params.id;

    // Count both incoming and outgoing accepted connections
    const totalConnections = await Connection.countDocuments({
      $or: [
        { requester: userId, status: "accepted" },
        { recipient: userId, status: "accepted" },
      ],
    });

    res.status(200).json({
      success: true,
      data: {
        totalConnections,
      },
    });
  } catch (error) {
    console.error("Error fetching total connections:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch total connections",
      error: error.message,
    });
  }
};

// Send connection request
export const sendConnectionRequest = async (req, res) => {
  try {
    const { recipientId } = req.body;
    const requesterId = req.user._id; // Current authenticated user

    if (requesterId.toString() === recipientId.toString()) {
      return res.status(400).json({
        success: false,
        message: "You cannot send a connection request to yourself",
      });
    }

    // Check if users exist
    const [requester, recipient] = await Promise.all([
      User.findById(requesterId),
      User.findById(recipientId),
    ]);

    if (!requester || !recipient) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Check if connection already exists
    const existingConnection = await Connection.findOne({
      $or: [
        { requester: requesterId, recipient: recipientId },
        { requester: recipientId, recipient: requesterId },
      ],
    });

    if (existingConnection) {
      return res.status(400).json({
        success: false,
        message: "Connection request already exists",
      });
    }

    // Create new connection request
    const connection = await Connection.create({
      requester: requesterId,
      recipient: recipientId,
      status: "pending",
    });

    // Add a notification for the recipient
    try {
      await addNotification({
        recipient: recipientId,
        sender: requesterId,
        type: "connection_request",
        title: "New Connection Request",
        content: `${requester.username} has sent you a connection request.`,
        referenceId: connection._id,
        referenceModel: "Connection",
      });
    } catch (notifError) {
      // Log the error but don't fail the request - the connection is still created
      console.error("Error sending notification:", notifError);
      // We'll continue with the response even if notification fails
    }

    res.status(201).json({
      success: true,
      message: "Connection request sent successfully",
      data: connection,
    });
  } catch (error) {
    console.error("Error sending connection request:", error);
    res.status(500).json({
      success: false,
      message: "Failed to send connection request",
      error: error.message,
    });
  }
};

export const updateProfilePicture = async (req, res) => {
  try {
    const userId = req.user.id; // Assuming you're using authentication middleware
    const { profilePicture } = req.body; // Expect Base64 string from the frontend

    if (!profilePicture) {
      return res.status(400).json({
        success: false,
        message: "Profile picture is required",
      });
    }

    // Decode Base64 and save the image to the server
    const base64Data = profilePicture.replace(/^data:image\/\w+;base64,/, "");
    const fileExtension = profilePicture.split(";")[0].split("/")[1]; // Extract file extension
    const fileName = `profile-${userId}-${Date.now()}.${fileExtension}`;
    const filePath = path.join("uploads/profile-pictures", fileName);

    // Save the image to the server
    fs.writeFileSync(filePath, base64Data, { encoding: "base64" });

    // Update the user's profile picture in the database
    const user = await User.findByIdAndUpdate(
      userId,
      { profilePicture: filePath.replace(/\\/g, "/") }, // Normalize path for cross-platform compatibility
      { new: true }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Profile picture updated successfully",
      data: { profilePicture: user.profilePicture },
    });
  } catch (error) {
    console.error("Error updating profile picture:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update profile picture",
      error: error.message,
    });
  }
};

// Accept connection request
export const acceptConnectionRequest = async (req, res) => {
  try {
    const { connectionId } = req.params;
    const userId = req.user._id; // Assuming you have authentication middleware

    // Find the connection request
    const connection = await Connection.findById(connectionId);

    if (!connection) {
      return res.status(404).json({
        success: false,
        message: "Connection request not found",
      });
    }

    // Verify that the current user is the recipient
    if (connection.recipient.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to accept this request",
      });
    }

    // Check if request is already accepted or rejected
    if (connection.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: `Connection request is already ${connection.status}`,
      });
    }

    // Update connection status to accepted
    connection.status = "accepted";
    await connection.save();

    // Try to add a notification for the requester, but don't fail if it doesn't work
    try {
      await addNotification({
        recipient: connection.requester,
        sender: userId,
        type: "connection_accepted",
        title: "Connection Request Accepted",
        content: `${req.user.username} has accepted your connection request.`,
        referenceId: connection._id,
        referenceModel: "Connection",
      });
    } catch (notifError) {
      // Just log the error but don't fail the request - the connection is still accepted
      console.error("Error sending notification:", notifError);
    }

    res.status(200).json({
      success: true,
      message: "Connection request accepted",
      data: connection,
    });
  } catch (error) {
    console.error("Error accepting connection request:", error);
    res.status(500).json({
      success: false,
      message: "Failed to accept connection request",
      error: error.message,
    });
  }
};

// Remove connection (unfollow user)
export const removeConnection = async (req, res) => {
  try {
    const { userId } = req.params; // ID of the user to unfollow
    const currentUserId = req.user._id; // Current authenticated user

    // Find any connection between these two users (regardless of who requested it)
    const connection = await Connection.findOne({
      $or: [
        { requester: currentUserId, recipient: userId },
        { requester: userId, recipient: currentUserId },
      ],
    });

    if (!connection) {
      return res.status(404).json({
        success: false,
        message: "Connection not found",
      });
    }

    // Delete the connection
    await Connection.findByIdAndDelete(connection._id);

    // Add a notification for the other user
    const otherUserId =
      connection.requester.toString() === currentUserId.toString()
        ? connection.recipient
        : connection.requester;

    await addNotification({
      recipient: otherUserId,
      sender: currentUserId,
      type: "connection_removed",
      title: "Connection Removed",
      content: `${req.user.username} has removed the connection with you.`,
      referenceModel: "User",
    });

    res.status(200).json({
      success: true,
      message: "Connection removed successfully",
    });
  } catch (error) {
    console.error("Error removing connection:", error);
    res.status(500).json({
      success: false,
      message: "Failed to remove connection",
      error: error.message,
    });
  }
};

// Get pending connection requests for the current user
export const getPendingConnectionRequests = async (req, res) => {
  try {
    const userId = req.user._id; // Current authenticated user

    // Find pending connection requests where the current user is the recipient
    const pendingRequests = await Connection.find({
      recipient: userId,
      status: "pending",
    }).populate("requester", "username email profilePicture");

    res.status(200).json({
      success: true,
      message: "Pending connection requests fetched successfully",
      data: pendingRequests,
    });
  } catch (error) {
    console.error("Error fetching pending connection requests:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch pending connection requests",
      error: error.message,
    });
  }
};

// Check if two users are connected
export const checkConnectionStatus = async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user._id;

    // Check for direct connection
    const directConnection = await Connection.findOne({
      $or: [
        { requester: currentUserId, recipient: userId, status: "accepted" },
        { requester: userId, recipient: currentUserId, status: "accepted" },
      ],
    });

    // Check for mutual connections
    const mutualConnections = await Connection.findMutualConnections(
      currentUserId,
      userId
    );

    res.status(200).json({
      success: true,
      data: {
        isConnected: !!directConnection,
        hasDirectConnection: !!directConnection,
        hasMutualConnections: mutualConnections.length > 0,
        mutualConnectionsCount: mutualConnections.length,
      },
    });
  } catch (error) {
    console.error("Error checking connection status:", error);
    res.status(500).json({
      success: false,
      message: "Failed to check connection status",
      error: error.message,
    });
  }
};

// Check if there's a pending connection request
export const checkPendingRequest = async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user._id;

    // Check for pending connection from current user to target user
    const pendingRequest = await Connection.findOne({
      requester: currentUserId,
      recipient: userId,
      status: "pending",
    });

    res.status(200).json({
      success: true,
      data: {
        isPending: !!pendingRequest,
        connectionId: pendingRequest ? pendingRequest._id : null,
      },
    });
  } catch (error) {
    console.error("Error checking pending request:", error);
    res.status(500).json({
      success: false,
      message: "Failed to check pending request status",
      error: error.message,
    });
  }
};

// Cancel a pending connection request
export const cancelConnectionRequest = async (req, res) => {
  try {
    const { connectionId } = req.params;
    const currentUserId = req.user._id;

    // Find the connection request
    const connection = await Connection.findById(connectionId);

    if (!connection) {
      return res.status(404).json({
        success: false,
        message: "Connection request not found",
      });
    }

    // Verify that the current user is the requester
    if (connection.requester.toString() !== currentUserId.toString()) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to cancel this request",
      });
    }

    // Check if request is still pending
    if (connection.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: `Cannot cancel a connection that is already ${connection.status}`,
      });
    }

    // Delete the connection request first
    await Connection.findByIdAndDelete(connectionId);

    // Try to add a notification, but don't fail if it doesn't work
    try {
      await addNotification({
        recipient: connection.recipient,
        sender: currentUserId,
        type: "connection_cancelled",
        title: "Connection Request Cancelled",
        content: `${req.user.username} has cancelled their connection request.`,
        referenceModel: "User",
      });
    } catch (notifError) {
      // Just log the error and continue - don't let notification failure prevent success response
      console.error("Error adding notification:", notifError);
    }

    // Send success response even if notification failed
    return res.status(200).json({
      success: true,
      message: "Connection request cancelled successfully",
    });
  } catch (error) {
    console.error("Error cancelling connection request:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to cancel connection request",
      error: error.message,
    });
  }
};

// Reject connection request
export const rejectConnectionRequest = async (req, res) => {
  try {
    const { connectionId } = req.params;
    const userId = req.user._id;

    // Find the connection request
    const connection = await Connection.findById(connectionId);

    if (!connection) {
      return res.status(404).json({
        success: false,
        message: "Connection request not found",
      });
    }

    // Verify that the current user is the recipient
    if (connection.recipient.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to reject this request",
      });
    }

    // Check if request is still pending
    if (connection.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: `Cannot reject a connection that is already ${connection.status}`,
      });
    }

    // Update connection status to rejected
    connection.status = "rejected";
    await connection.save();

    // Try to add a notification for the requester, but don't fail if it doesn't work
    try {
      await addNotification({
        recipient: connection.requester,
        sender: userId,
        type: "connection_rejected",
        title: "Connection Request Rejected",
        content: `${req.user.username} has declined your connection request.`,
        referenceId: connection._id,
        referenceModel: "Connection",
      });
    } catch (notifError) {
      // Just log the error but don't fail the request
      console.error("Error sending notification:", notifError);
    }

    res.status(200).json({
      success: true,
      message: "Connection request rejected",
    });
  } catch (error) {
    console.error("Error rejecting connection request:", error);
    res.status(500).json({
      success: false,
      message: "Failed to reject connection request",
      error: error.message,
    });
  }
};
