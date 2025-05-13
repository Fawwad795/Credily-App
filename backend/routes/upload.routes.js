import express from "express";
import upload from "../middleware/upload.middleware.js";
import {
  uploadImage,
  uploadBase64Image,
  uploadProfilePicture,
} from "../controllers/upload.controller.js";
import { authenticateUser } from "../middleware/auth.middleware.js";

const router = express.Router();

// Route for uploading image file
router.post("/image", authenticateUser, upload.single("image"), uploadImage);

// Route for uploading image as base64 string
router.post("/base64", authenticateUser, uploadBase64Image);

// Route for uploading profile picture
router.post(
  "/profile-picture/:userId",
  upload.single("profilePicture"),
  uploadProfilePicture
);

export default router;
