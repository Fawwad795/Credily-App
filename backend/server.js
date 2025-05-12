import express from "express";
import http from "http";
import { Server } from "socket.io";
import messageRoutes from "./routes/message.routes.js"; // Your existing routes

const app = express();
const server = http.createServer(app); // Create an HTTP server
const io = new Server(server, {
  cors: {
    origin: "*", // Allow all origins (adjust for production)
  },
});

// Middleware to attach Socket.IO instance to requests
app.use((req, res, next) => {
  req.io = io;
  next();
});

// Your existing middleware and routes
app.use(express.json());
app.use("/api/messages", messageRoutes);

// Socket.IO connection
io.on("connection", (socket) => {
  console.log("A user connected:", socket.id);

  // Join a room for a specific user
  socket.on("joinRoom", (userId) => {
    socket.join(userId);
    console.log(`User ${userId} joined their room`);
  });

  // Handle disconnection
  socket.on("disconnect", () => {
    console.log("A user disconnected:", socket.id);
  });
});

// Start the server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});