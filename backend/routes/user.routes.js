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
  updateProfilePicture
} from "../controllers/user.controller.js";
import { protect } from "../middlewares/authMiddleware.js"; 

const router = express.Router();

// Auth routes
router.post("/register", registerUser);
router.post("/login", loginUser);

router.get("/profile/:id", getUserProfile);
router.put("/profile/:id", updateUserProfile);

router.post("/profile-picture", protect, updateProfilePicture);

// Search and listing routes
router.get("/search", searchUsers);
router.get("/top", getTopUsers);

// Activity routes
router.put("/last-active/:id", updateLastActive);

export default router;
