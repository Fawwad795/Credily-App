import express from "express";
import {
  registerUser,
  loginUser,
  getUserProfile,
  updateUserProfile,
  searchUsers,
  getTopUsers,
  updateLastActive,
  getTotalConnections,
  updateProfilePicture,
  searchUsersByUsername
} from "../controllers/user.controller.js";
import { authenticateUser, protect } from "../middleware/auth.middleware.js"; 

const router = express.Router();

// Auth routes (public)
router.post("/register", registerUser);
router.post("/login", loginUser);

// Protected routes (require authentication)
router.use(authenticateUser); // Apply authentication to all routes below

// Profile routes
router.get("/profile/:id", getUserProfile);
router.put("/profile/:id", updateUserProfile);

// Connection routes
router.post("/connections", sendConnectionRequest);
router.put("/connections/:connectionId/accept", acceptConnectionRequest);
router.get("/:id/connections", getTotalConnections);

// Search and listing routes
router.get("/search", protect, searchUsersByUsername);
router.get("/top", getTopUsers);

// Activity routes
router.put("/last-active/:id", updateLastActive);

export default router;
