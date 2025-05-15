import express from "express";
import {
  leaveReview,
  getUserReviews,
  analyzeSentimentRealtime,
} from "../controllers/review.controller.js";
import { authenticateUser } from "../middleware/auth.middleware.js";

const router = express.Router();

// Endpoint to leave a review
router.post("/leave", authenticateUser, leaveReview);

// Endpoint to get reviews for a specific user
router.get("/user/:userId", getUserReviews);

// Endpoint for real-time sentiment analysis
router.post("/analyze-sentiment", authenticateUser, analyzeSentimentRealtime);

export default router;
