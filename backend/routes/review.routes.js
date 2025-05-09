import express from "express";
import { leaveReview } from "../controllers/review.controller.js";
import { protect } from "../middlewares/authMiddleware.js"; // Assuming you have an auth middleware

const router = express.Router();

// Endpoint to leave a review
router.post("/leave", protect, leaveReview);

export default router;