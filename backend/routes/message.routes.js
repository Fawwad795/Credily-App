import express from 'express';
import { 
  sendMessage, 
  getConversations, 
  getMessages, 
  getUnreadCount 
} from '../controllers/message.controller.js';
import { verifyToken } from '../middleware/auth.middleware.js';

const router = express.Router();

// Get all conversations for the current user
router.get('/conversations', verifyToken, getConversations);

// Get messages between current user and another user
router.get('/conversation/:userId', verifyToken, getMessages);

// Get unread message count
router.get('/unread-count', verifyToken, getUnreadCount);

// Send a new message
router.post('/', verifyToken, sendMessage);

export default router;