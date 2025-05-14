import express from "express";
import cors from "cors";
import http from "http";
import { Server } from "socket.io";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import userRoutes from "./routes/user.routes.js";
import messageRoutes from "./routes/message.routes.js";
import postRoutes from "./routes/post.routes.js";
import notificationRoutes from "./routes/notification.routes.js";
import uploadRoutes from "./routes/upload.routes.js";
import reviewRoutes from "./routes/review.routes.js";
import path from "path";
import { fileURLToPath } from "url";
import { createRequire } from "module";
import {
  addUser,
  removeUser,
  getUserById,
  getUserByEmail,
  getAllUsers,
} from "./utils/socketUsers.js";
import Message from "./models/message.model.js"; // Import your Message model

// For ES modules to use process
const require = createRequire(import.meta.url);
const process = require("process");

// For __dirname in ES module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config();

// Connect to MongoDB with retry
const connectWithRetry = async () => {
  let retries = 3;
  while (retries > 0) {
    try {
      await connectDB();
      return;
    } catch (error) {
      retries--;
      if (retries === 0) {
        console.error(
          "Failed to connect to MongoDB after all retries:",
          error.message
        );
        throw error;
      }
      console.log(
        `Retrying MongoDB connection... (${retries} attempts remaining)`
      );
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
  }
};

// Initialize Express app
const app = express();

// Connect to MongoDB with retry
try {
  await connectWithRetry();
} catch (error) {
  console.error("Could not connect to MongoDB:", error.message);
}

// Middleware
app.use(cors());
app.use(express.json({ limit: "50mb" })); // Increased limit for base64 images
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Serve static files from uploads directory
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Create HTTP server and integrate Socket.IO
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: [
      "http://localhost:5173",
      "http://localhost:3000",
      "http://127.0.0.1:5173",
    ], // Add your frontend URLs
    methods: ["GET", "POST"],
    credentials: true,
  },
  pingTimeout: 30000,
  pingInterval: 10000,
  transports: ["websocket", "polling"],
  connectTimeout: 5000,
});

// Make io accessible to routes
app.use((req, res, next) => {
  req.io = io;
  next();
});

// Routes
app.use("/api/users", userRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/uploads", uploadRoutes);
app.use("/api/reviews", reviewRoutes);

// Root route for testing
app.get("/", (req, res) => {
  res.send("API is running...");
});

// Helper function to get user by socket ID (missing function)
const getUserBySocketId = (socketId) => {
  const users = getAllUsers();
  return users.find((user) => user.socketId === socketId);
};

// Socket.IO connection handling
io.on("connection", (socket) => {
  // Join a room for a specific user (using MongoDB ObjectId)
  socket.on("joinRoom", (userId) => {
    socket.join(userId);
    addUser(userId, socket.id);

    // Emit user joined event
    io.emit("getUsers", getAllUsers());
  });

  // Add user with email or with user object
  socket.on("addUser", (userData) => {
    // Handle both formats - string and object
    if (typeof userData === "string") {
      const email = userData;
      if (email) {
        // Get the existing user if they connected with userId already
        const existingUser = getUserBySocketId(socket.id);
        if (existingUser) {
          // Update with email
          addUser(existingUser.userId, socket.id, email);
        } else {
          // Add new user with email as both userId and email
          addUser(email, socket.id, email);
        }

        // Emit updated users list to all clients
        io.emit("getUsers", getAllUsers());
      }
    } else if (userData && userData.userId && userData.userEmail) {
      // New format with user object
      const { userId, userEmail } = userData;
      addUser(userId, socket.id, userEmail);

      // Emit updated users list to all clients
      io.emit("getUsers", getAllUsers());
    }
  });

  // Add event listener to handle new notifications
  socket.on("sendNotification", (data) => {
    // data should contain the recipient userId
    const { recipient, notification } = data;
    if (recipient) {
      // Send notification to specific user's room
      io.to(recipient).emit("newNotification", notification);
    }
  });

  // Handle message read status
  socket.on("markAsRead", async ({ messageId, chatId }) => {
    try {
      // Update message read status in database
      await Message.findByIdAndUpdate(messageId, { isRead: true });

      // Notify sender that message was read
      const message = await Message.findById(messageId);
      if (message) {
        io.to(message.sender.toString()).emit("messageRead", {
          messageId,
          chatId,
        });
      }

      // Emit acknowledgment back to the client
      socket.emit("markAsReadAck", { success: true, messageId, chatId });
    } catch (error) {
      console.error("Error marking message as read:", error);
      socket.emit("markAsReadAck", { success: false, error: error.message });
    }
  });

  // Handle sendMessage event
  socket.on("sendMessage", async (messageData) => {
    try {
      // Handle message format from MongoDB-style client
      if (messageData.sender && messageData.receiver) {
        const receiver = getUserById(messageData.receiver);
        if (receiver) {
          // Add isCurrentUser flag to the message
          const messageWithFlags = {
            ...messageData,
            sender: {
              ...messageData.sender,
              isCurrentUser: true,
            },
          };
          io.to(receiver.socketId).emit("newMessage", messageWithFlags);
        }
      }
      // Handle message format from MySQL-style client
      else if (messageData.senderEmail && messageData.receiverEmail) {
        const { senderEmail, receiverEmail, text, timestamp } = messageData;

        // Find receiver socket
        const receiver = getUserByEmail(receiverEmail);

        // For MongoDB storage, attempt to save
        try {
          const message = await Message.create({
            sender: senderEmail, // Using email as ID for MySQL compatibility
            receiver: receiverEmail,
            content: text,
            messageType: "text",
            createdAt: timestamp || new Date(),
          });

          // Emit to receiver if online
          if (receiver) {
            io.to(receiver.socketId).emit("getMessage", {
              senderEmail,
              text,
              timestamp: timestamp || new Date(),
              messageId: message._id.toString(),
            });
          }
        } catch (err) {
          console.error("Error saving message to MongoDB:", err);

          // Still emit message even if saving fails
          if (receiver) {
            io.to(receiver.socketId).emit("getMessage", {
              senderEmail,
              text,
              timestamp: timestamp || new Date(),
            });
          }
        }
      }
    } catch (error) {
      console.error("Error processing message:", error);
    }
  });

  // Listen for events from message routes
  // This allows the API routes to emit socket events
  socket.on("registerForNewMessages", (userId) => {
    socket.join(`user:${userId}:messages`);
  });

  // Handle disconnection
  socket.on("disconnect", () => {
    removeUser(socket.id);
    io.emit("getUsers", getAllUsers());
  });
});

// Add message route utility to emit socket events
app.use((req, res, next) => {
  req.socketEmitNewMessage = (receiverId, message) => {
    try {
      console.log(`Emitting new message to ${receiverId}:`, message);
      // Emit to the specific user room
      io.to(receiverId).emit("newMessage", message);
      // Also emit acknowledgment to sender
      io.to(message.sender._id || message.sender).emit("messageReceived", {
        success: true,
        messageId: message._id,
      });
      return true;
    } catch (error) {
      console.error("Error emitting socket message:", error);
      return false;
    }
  };
  next();
});

// Fix the server configuration to use a single port
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export default app;
