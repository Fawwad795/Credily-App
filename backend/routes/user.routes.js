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
  getTotalFollowing,
  updateProfilePicture,
  updateWallpaperPicture,
  searchUsersByUsername,
  sendConnectionRequest,
  acceptConnectionRequest,
  getPendingConnectionRequests,
  checkConnectionStatus,
  removeConnection,
  checkPendingRequest,
  cancelConnectionRequest,
  rejectConnectionRequest,
  updateUserAdditionalInfo,
  checkUsernameAvailability,
  checkPhoneAvailability,
  checkEmailAvailability,
  getSuggestedUsers,
  getConnectionById,
} from "../controllers/user.controller.js";
import { authenticateUser, protect } from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);

router.get("/profile/:id", getUserProfile);
router.put("/profile/:id", updateUserProfile);
router.put("/profile-picture", protect, updateProfilePicture);
router.put("/wallpaper", protect, updateWallpaperPicture);
router.put("/profile/:id/additional-info", updateUserAdditionalInfo);
router.get("/check-username/:username", checkUsernameAvailability);
router.get("/check-phone/:phoneNumber", checkPhoneAvailability);
router.get("/check-email/:email", checkEmailAvailability);

router.post("/connections", protect, sendConnectionRequest);
router.put(
  "/connections/:connectionId/accept",
  protect,
  acceptConnectionRequest
);
router.put(
  "/connections/:connectionId/reject",
  protect,
  rejectConnectionRequest
);
router.delete("/connections/:userId/remove", protect, removeConnection);
router.delete(
  "/connections/:connectionId/cancel",
  protect,
  cancelConnectionRequest
);
router.get("/connections/pending", protect, getPendingConnectionRequests);
router.get("/connections/:userId/status", protect, checkConnectionStatus);
router.get("/connections/:userId/pending", protect, checkPendingRequest);
router.get("/:id/connections", getTotalConnections);
router.get("/:id/following", getTotalFollowing);

router.get("/search", protect, searchUsersByUsername);
router.get("/top", getTopUsers);
router.get("/suggested", protect, getSuggestedUsers);

router.put("/last-active/:id", updateLastActive);

router.get("/connections/:connectionId", protect, getConnectionById);

export default router;
