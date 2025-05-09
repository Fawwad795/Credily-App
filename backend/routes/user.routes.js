import express from "express";
import {
  registerUser,
  loginUser,
  getUserProfile,
  updateUserProfile,
  searchUsers,
  getTopUsers,
  updateLastActive,
  updateProfilePicture
} from "../controllers/user.controller.js";
import { protect } from "../middlewares/authMiddleware.js"; // Assuming you have an auth middleware

const router = express.Router();

// Auth routes
router.post("/register", registerUser);
router.post("/login", loginUser);

// Profile routes
router.get("/profile/:id", getUserProfile);
router.put("/profile/:id", updateUserProfile);

// Endpoint to upload/change profile picture
router.post("/profile-picture", protect, updateProfilePicture);

// Search and listing routes
router.get("/search", searchUsers);
router.get("/top", getTopUsers);

// Activity routes
router.put("/last-active/:id", updateLastActive);

export default router;
