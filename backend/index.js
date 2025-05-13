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

// Initialize Express app
const app = express();

// Connect to MongoDB
connectDB();

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
  pingTimeout: 60000,
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
  console.log(`User connected: ${socket.id}`);

  // Join a room for a specific user (using MongoDB ObjectId)
  socket.on("joinRoom", (userId) => {
    socket.join(userId);
    addUser(userId, socket.id);
    console.log(`User ${userId} joined their room`);
  });

  // Add user with email (for MySQL compatibility)
  socket.on("addUser", (email) => {
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
      console.log(`User ${email} added with socket ${socket.id}`);
    }
  });

  // Handle sendMessage event - support both MongoDB and MySQL formats
  socket.on("sendMessage", async (messageData) => {
    try {
      // Handle message format from MySQL-style client
      if (messageData.senderEmail && messageData.receiverEmail) {
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

          console.log(`Message stored in MongoDB: ${message._id}`);

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
      // Handle message format from MongoDB-style client
      else if (messageData.sender && messageData.receiver) {
        const receiver = getUserById(messageData.receiver);
        if (receiver) {
          io.to(receiver.socketId).emit("newMessage", messageData);
        }
      } else {
        console.warn("Invalid message format:", messageData);
      }
    } catch (error) {
      console.error("Error processing message:", error);
    }
  });

  // Handle disconnection
  socket.on("disconnect", () => {
    console.log(`User disconnected: ${socket.id}`);
    removeUser(socket.id);
    io.emit("getUsers", getAllUsers());
  });
});

// Fix the server configuration to use a single port
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export default app;
