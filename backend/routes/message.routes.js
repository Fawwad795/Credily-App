import express from "express";
import {
  sendMessage,
  getConversations,
  getMessages,
  getUnreadCount,
} from "../controllers/message.controller.js";
import { protect } from "../middleware/auth.middleware.js";

const router = express.Router();

// Get all conversations for the current user
router.get("/conversations", protect, getConversations);

// Get messages between current user and another user
router.get("/conversation/:userId", protect, getMessages);

// Get unread message count
router.get("/unread-count", protect, getUnreadCount);

// Send a new message
router.post("/", protect, sendMessage);

export default router;
