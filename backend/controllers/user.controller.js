import User from "../models/user.model.js";
import jwt from "jsonwebtoken";
import Connection from "../models/connection.model.js";
import fs from "fs";
import path from "path";
import { addNotification } from "./notification.controller.js"; // Import the notification function
import cloudinary from "../config/cloudinary.js";
import mongoose from "mongoose";

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: "30d",
  });
};

// Helper function to capitalize first letter of a string
const capitalizeFirstLetter = (string) => {
  if (!string) return string;
  return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase();
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

    // Convert username to lowercase for checking
    const lowercaseUsername = username.toLowerCase();

    // Check if username already exists (case insensitive)
    const usernameExists = await User.findOne({ username: lowercaseUsername });
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

    // Create new user (username will be automatically converted to lowercase by the schema)
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

// Update user additional information after initial registration
export const updateUserAdditionalInfo = async (req, res) => {
  try {
    const userId = req.params.id;
    let { firstName, lastName, email, bio, location } = req.body;

    // Capitalize first and last names
    if (firstName) {
      firstName = capitalizeFirstLetter(firstName);
    }

    if (lastName) {
      lastName = capitalizeFirstLetter(lastName);
    }

    // If email is provided, check if it already exists for a different user
    if (email) {
      const existingUser = await User.findOne({ email, _id: { $ne: userId } });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: "Email is already in use by another account",
          error: "duplicate_email",
        });
      }
    }

    // Update the user with additional information
    const user = await User.findByIdAndUpdate(
      userId,
      {
        firstName,
        lastName,
        email,
        bio,
        location,
      },
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
      message: "Profile additional information updated successfully",
      data: user,
    });
  } catch (error) {
    console.error("Error updating user additional information:", error);

    // Check specifically for MongoDB duplicate key error
    if (error.code === 11000 && error.keyPattern && error.keyPattern.email) {
      return res.status(400).json({
        success: false,
        message: "Email is already in use by another account",
        error: "duplicate_email",
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to update profile additional information",
      error: error.message,
    });
  }
};

// Login user
export const loginUser = async (req, res) => {
  try {
    const { username, password } = req.body;

    // Convert username to lowercase for checking
    const lowercaseUsername = username.toLowerCase();

    // Check if user exists (case insensitive)
    const user = await User.findOne({ username: lowercaseUsername }).select(
      "+password"
    );
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid username or password",
        error: "invalid_credentials",
      });
    }

    // Check if password is correct
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid username or password",
        error: "invalid_credentials",
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

    // Escape any special regex characters in the query to avoid regex injection
    const sanitizedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

    // Convert to lowercase for case-insensitive search
    const lowercaseQuery = sanitizedQuery.toLowerCase();

    // Create a regex pattern that matches usernames starting with the query
    // The ^ anchor ensures matching from the start of the string
    // The 'i' flag makes it case-insensitive, but we're additionally using toLowerCase for consistency
    const regex = new RegExp(`^${lowercaseQuery}`);

    // Perform a prefix search for usernames
    const users = await User.find({
      username: { $regex: regex }, // Match usernames that start with the query
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

    // Find both incoming and outgoing accepted connections
    const connections = await Connection.find({
      $or: [
        { requester: userId, status: "accepted" },
        { recipient: userId, status: "accepted" },
      ],
    });

    // Count the total connections
    const totalConnections = connections.length;

    // Get the user IDs of the connections (the other user in each connection)
    const connectionUserIds = connections.map((conn) =>
      conn.requester.toString() === userId ? conn.recipient : conn.requester
    );

    // Get the profile data for each connected user
    const connectionUsers = await User.find(
      { _id: { $in: connectionUserIds } },
      { username: 1, firstName: 1, lastName: 1, profilePicture: 1 }
    ).limit(5); // Limit to 5 for the avatar display

    res.status(200).json({
      success: true,
      data: {
        totalConnections,
        connectionUsers,
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

    // Upload base64 image to Cloudinary
    const uploadResult = await cloudinary.uploader.upload(profilePicture, {
      folder: "profile-pictures",
      resource_type: "auto",
      transformation: [
        { width: 500, height: 500, crop: "fill" },
        { quality: "auto" },
      ],
    });

    // Update the user's profile picture in the database
    const user = await User.findByIdAndUpdate(
      userId,
      {
        profilePicture: uploadResult.secure_url,
        profilePictureId: uploadResult.public_id,
      },
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
      data: {
        profilePicture: user.profilePicture,
        user: user,
      },
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

export const updateWallpaperPicture = async (req, res) => {
  try {
    const userId = req.user.id; // Assuming you're using authentication middleware
    const { wallpaper } = req.body; // Expect Base64 string from the frontend

    if (!wallpaper) {
      return res.status(400).json({
        success: false,
        message: "Wallpaper picture is required",
      });
    }

    // Upload base64 image to Cloudinary
    const uploadResult = await cloudinary.uploader.upload(wallpaper, {
      folder: "wallpapers",
      resource_type: "auto",
      transformation: [
        { width: 1280, height: 400, crop: "fill" },
        { quality: "auto" },
      ],
    });

    // Delete previous wallpaper if exists
    if (req.user.wallpaperPictureId) {
      try {
        await cloudinary.uploader.destroy(req.user.wallpaperPictureId);
      } catch (err) {
        console.error("Error deleting previous wallpaper:", err);
        // Continue with the update even if deletion fails
      }
    }

    // Update the user's wallpaper picture in the database
    const user = await User.findByIdAndUpdate(
      userId,
      {
        wallpaperPicture: uploadResult.secure_url,
        wallpaperPictureId: uploadResult.public_id,
      },
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
      message: "Wallpaper picture updated successfully",
      data: {
        wallpaperPicture: user.wallpaperPicture,
        user: user,
      },
    });
  } catch (error) {
    console.error("Error updating wallpaper picture:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update wallpaper picture",
      error: error.message,
    });
  }
};

// Accept connection request
export const acceptConnectionRequest = async (req, res) => {
  try {
    const { connectionId } = req.params;

    // Add check to ensure req.user exists
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required. User is not authenticated.",
      });
    }

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

    // Find and mark the original connection request notification as read
    const Notification = mongoose.model("Notification");
    await Notification.updateMany(
      {
        recipient: userId,
        referenceId: connectionId,
        type: "connection_request",
        isRead: false,
      },
      { isRead: true }
    );

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

    // Add check to ensure req.user exists
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required. User is not authenticated.",
      });
    }

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

    // Find and mark the original connection request notification as read
    const Notification = mongoose.model("Notification");
    await Notification.updateMany(
      {
        recipient: userId,
        referenceId: connectionId,
        type: "connection_request",
        isRead: false,
      },
      { isRead: true }
    );

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

// Check if a username is available
export const checkUsernameAvailability = async (req, res) => {
  try {
    const { username } = req.params;

    if (!username) {
      return res.status(400).json({
        success: false,
        message: "Username parameter is required",
      });
    }

    // Validate username length
    if (username.length < 3) {
      return res.status(400).json({
        success: false,
        message: "Username must be at least 3 characters long",
        available: false,
      });
    }

    // Convert username to lowercase for checking
    const lowercaseUsername = username.toLowerCase();

    // Check if username exists in database (case insensitive)
    const existingUser = await User.findOne({ username: lowercaseUsername });

    res.status(200).json({
      success: true,
      available: !existingUser,
      message: existingUser
        ? "Username is already taken"
        : "Username is available",
    });
  } catch (error) {
    console.error("Error checking username availability:", error);
    res.status(500).json({
      success: false,
      message: "Failed to check username availability",
      error: error.message,
    });
  }
};

// Check if a phone number is available
export const checkPhoneAvailability = async (req, res) => {
  try {
    const { phoneNumber } = req.params;

    if (!phoneNumber) {
      return res.status(400).json({
        success: false,
        message: "Phone number parameter is required",
      });
    }

    // Format the phone number for checking
    // Add the "+" if not already present
    const formattedPhoneNumber = phoneNumber.startsWith("+")
      ? phoneNumber
      : `+${phoneNumber}`;

    // Check if phone number exists in database
    const existingUser = await User.findOne({
      phoneNumber: formattedPhoneNumber,
    });

    res.status(200).json({
      success: true,
      available: !existingUser,
      message: existingUser
        ? "An account is already registered with this phone number"
        : "Phone number is available",
    });
  } catch (error) {
    console.error("Error checking phone number availability:", error);
    res.status(500).json({
      success: false,
      message: "Failed to check phone number availability",
      error: error.message,
    });
  }
};

// Check if an email is available
export const checkEmailAvailability = async (req, res) => {
  try {
    const { email } = req.params;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email parameter is required",
      });
    }

    // Convert email to lowercase for checking
    const lowercaseEmail = email.toLowerCase();

    // Validate email format
    const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
    if (!emailRegex.test(lowercaseEmail)) {
      return res.status(400).json({
        success: false,
        message: "Invalid email format",
        available: false,
      });
    }

    // Check if email exists in database
    const existingUser = await User.findOne({ email: lowercaseEmail });

    res.status(200).json({
      success: true,
      available: !existingUser,
      message: existingUser
        ? "Email is already in use by another account"
        : "Email is available",
    });
  } catch (error) {
    console.error("Error checking email availability:", error);
    res.status(500).json({
      success: false,
      message: "Failed to check email availability",
      error: error.message,
    });
  }
};

// Get users not connected to the current user (for suggestions)
export const getSuggestedUsers = async (req, res) => {
  try {
    const currentUserId = req.user._id;

    // Find all connections for the current user (both outgoing and incoming)
    const connections = await Connection.find({
      $or: [{ requester: currentUserId }, { recipient: currentUserId }],
    });

    // Extract all user IDs that the current user is already connected with (or has pending requests)
    const connectedUserIds = connections.map((conn) =>
      String(conn.requester) === String(currentUserId)
        ? conn.recipient
        : conn.requester
    );

    // Add current user to the exclusion list
    connectedUserIds.push(currentUserId);

    // Find users that are not in the connected list, limit to 5
    const suggestedUsers = await User.find(
      { _id: { $nin: connectedUserIds } },
      "username profilePicture" // Only return necessary fields
    ).limit(5);

    res.status(200).json({
      success: true,
      message: "Suggested users fetched successfully",
      data: suggestedUsers,
    });
  } catch (error) {
    console.error("Error fetching suggested users:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch suggested users",
      error: error.message,
    });
  }
};

// Get total following (users that the specified user is following)
export const getTotalFollowing = async (req, res) => {
  try {
    const userId = req.params.id;

    // Find outgoing accepted connections (users that this user follows)
    const connections = await Connection.find({
      requester: userId,
      status: "accepted",
    });

    // Count the total following
    const totalFollowing = connections.length;

    // Get the user IDs this user is following
    const followingUserIds = connections.map((conn) => conn.recipient);

    // Get the profile data for a few followed users (for UI display if needed)
    const followingUsers = await User.find(
      { _id: { $in: followingUserIds } },
      { username: 1, firstName: 1, lastName: 1, profilePicture: 1 }
    ).limit(5); // Limit to 5 for the avatar display

    res.status(200).json({
      success: true,
      data: {
        totalFollowing,
        followingUsers,
      },
    });
  } catch (error) {
    console.error("Error fetching total following:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch total following",
      error: error.message,
    });
  }
};
