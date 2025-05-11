import express from "express";
import { leaveReview } from "../controllers/review.controller.js";
import { authenticateUser } from "../middleware/auth.middleware.js";

const router = express.Router();

// Endpoint to leave a review
router.post("/leave", authenticateUser, leaveReview);

export default router;
