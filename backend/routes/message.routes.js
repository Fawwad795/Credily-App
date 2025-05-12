import express from "express";
import {
  sendMessage,
  getConversation,
  getConversations,
  deleteMessage,
  getUnreadCount,
} from "../controllers/message.controller.js";
import { authenticateUser ,protect } from "../middleware/auth.middleware.js";

const router = express.Router();

// All routes require authentication
router.use(authenticateUser);

// Message routes
router.post("/send", sendMessage);
router.get("/conversation/:userId", getConversation);
router.get("/conversations", getConversations);
router.delete("/:messageId", deleteMessage);
router.get("/unread-count", getUnreadCount);

export default router; 