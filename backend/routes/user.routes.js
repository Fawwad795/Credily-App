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
  searchUsersByUsername,
  sendConnectionRequest,
  acceptConnectionRequest,
  getPendingConnectionRequests,
  checkConnectionStatus,
  removeConnection,
  checkPendingRequest,
  cancelConnectionRequest,
  rejectConnectionRequest,
} from "../controllers/user.controller.js";
import { authenticateUser, protect } from "../middleware/auth.middleware.js";

const router = express.Router();


router.post("/register", registerUser);
router.post("/login", loginUser);

router.get("/profile/:id", getUserProfile);
router.put("/profile/:id", updateUserProfile);
router.put("/profile/:id", updateProfilePicture);

router.post("/connections", sendConnectionRequest);
router.put("/connections/:connectionId/accept", acceptConnectionRequest);
router.put("/connections/:connectionId/reject", rejectConnectionRequest);
router.delete("/connections/:userId/remove", removeConnection);
router.delete("/connections/:connectionId/cancel", cancelConnectionRequest);
router.get("/connections/pending", getPendingConnectionRequests);
router.get("/connections/:userId/status", checkConnectionStatus);
router.get("/connections/:userId/pending", checkPendingRequest);
router.get("/:id/connections", getTotalConnections);


router.get("/search", protect, searchUsersByUsername);
router.get("/top", getTopUsers);


router.put("/last-active/:id", updateLastActive);

export default router;
