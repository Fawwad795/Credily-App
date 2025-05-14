import express from "express";
import upload from "../middleware/upload.middleware.js";
import {
  uploadImage,
  uploadBase64Image,
  uploadProfilePicture,
  uploadWallpaperPicture,
  uploadBase64Wallpaper,
} from "../controllers/upload.controller.js";
import { authenticateUser, protect } from "../middleware/auth.middleware.js";

const router = express.Router();

// Route for uploading image file
router.post("/image", authenticateUser, upload.single("image"), uploadImage);

// Route for uploading image as base64 string
router.post("/base64", authenticateUser, uploadBase64Image);

// Route for uploading profile picture
router.post(
  "/profile-picture/:userId",
  authenticateUser,
  upload.single("profilePicture"),
  uploadProfilePicture
);

// Route for uploading wallpaper picture
router.post(
  "/wallpaper/:userId",
  protect,
  upload.single("wallpaper"),
  uploadWallpaperPicture
);

// Route for uploading base64 encoded wallpaper
router.post("/wallpaper-base64", protect, uploadBase64Wallpaper);

export default router;
