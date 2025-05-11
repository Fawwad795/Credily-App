import express from "express";
import {
  addNotification,
  getUserNotifications,
} from "../controllers/notification.controller.js";
import { authenticateUser } from "../middleware/auth.middleware.js";

const router = express.Router();

// POST: Add a new notification
router.post("/", authenticateUser, addNotification);

// GET: Fetch notifications for a user
router.get("/", authenticateUser, getUserNotifications);

export default router;
