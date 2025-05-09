import express from "express";
import { addNotification, getUserNotifications } from "../controllers/notification.controller.js";
import { protect } from "../middlewares/authMiddleware.js"; // Assuming you have an auth middleware

const router = express.Router();

// POST: Add a new notification
router.post("/", protect, addNotification);

// GET: Fetch notifications for a user
router.get("/", protect, getUserNotifications);

export default router;