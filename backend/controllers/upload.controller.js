import fs from "fs";
import { uploadBase64Image as uploadBase64 } from "../utils/imageUpload.js";
import cloudinary from "../config/cloudinary.js";
import User from "../models/user.model.js";
import sharp from "sharp";

/**
 * Upload an image file to Cloudinary
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const uploadImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No image file provided",
      });
    }

    // Upload the file to Cloudinary
    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: "posts",
      resource_type: "auto",
    });

    // Remove the file from local storage after uploading to Cloudinary
    fs.unlinkSync(req.file.path);

    // Return success with the Cloudinary URL
    res.status(200).json({
      success: true,
      imageUrl: result.secure_url,
      public_id: result.public_id,
    });
  } catch (error) {
    console.error("Error uploading image:", error);

    // Clean up the file if it exists and there was an error
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    res.status(500).json({
      success: false,
      message: "Failed to upload image",
      error: error.message,
    });
  }
};

/**
 * Upload a base64 encoded image to Cloudinary
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const uploadBase64Image = async (req, res) => {
  try {
    const { image } = req.body;

    if (!image) {
      return res.status(400).json({
        success: false,
        message: "No base64 image provided",
      });
    }

    // Upload the base64 image to Cloudinary
    const uploadResult = await uploadBase64(image);

    if (!uploadResult.success) {
      return res.status(500).json({
        success: false,
        message: "Failed to upload image",
        error: uploadResult.error,
      });
    }

    // Return success with the Cloudinary URL
    res.status(200).json({
      success: true,
      imageUrl: uploadResult.url,
      public_id: uploadResult.public_id,
    });
  } catch (error) {
    console.error("Error uploading base64 image:", error);
    res.status(500).json({
      success: false,
      message: "Failed to upload base64 image",
      error: error.message,
    });
  }
};

/**
 * Upload a profile picture to Cloudinary and update user model
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const uploadProfilePicture = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No profile picture provided",
      });
    }

    // Upload the file to Cloudinary
    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: "profile-pictures",
      resource_type: "auto",
      transformation: [
        { width: 500, height: 500, crop: "fill" },
        { quality: "auto" },
      ],
    });

    // Remove the file from local storage after uploading to Cloudinary
    fs.unlinkSync(req.file.path);

    // Update the user's profile picture in the database
    const user = await User.findByIdAndUpdate(
      userId,
      {
        profilePicture: result.secure_url,
        profilePictureId: result.public_id, // Store the public ID for future updates/deletion
      },
      { new: true }
    ).select("-password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Return success with the updated user data
    res.status(200).json({
      success: true,
      message: "Profile picture updated successfully",
      data: {
        profilePicture: user.profilePicture,
        user: user,
      },
    });
  } catch (error) {
    console.error("Error uploading profile picture:", error);

    // Clean up the file if it exists and there was an error
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    res.status(500).json({
      success: false,
      message: "Failed to upload profile picture",
      error: error.message,
    });
  }
};

export const uploadWallpaperPicture = async (req, res) => {
  try {
    // Check if user is authenticated
    if (!req.user || !req.user._id) {
      return res.status(401).json({
        success: false,
        message: "Authentication required. User not authenticated.",
      });
    }

    const { userId } = req.params;

    // Verify the user has permission (either it's their own profile or they have admin rights)
    if (req.user._id.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to update this user's wallpaper",
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No wallpaper image provided",
      });
    }

    const filePath = req.file.path;
    let fileToUpload = filePath;
    let tempFile = null;

    // Get file stats to check size
    const stats = fs.statSync(filePath);
    const fileSizeInBytes = stats.size;

    // If file is larger than 8MB (leaving buffer below 10MB limit), compress it
    if (fileSizeInBytes > 8 * 1024 * 1024) {
      const tempFileName = `${Date.now()}-compressed.jpg`;
      const tempFilePath = `${req.file.destination}/${tempFileName}`;

      // Resize and compress with sharp
      await sharp(filePath)
        .resize({ width: 1920, height: 1080, fit: "inside" }) // Resize while maintaining aspect ratio
        .jpeg({ quality: 80 }) // Reduce quality to 80%
        .toFile(tempFilePath);

      tempFile = tempFilePath;
      fileToUpload = tempFilePath;
    }

    // Upload the file to Cloudinary
    const result = await cloudinary.uploader.upload(fileToUpload, {
      folder: "wallpapers",
      resource_type: "auto",
      transformation: [
        { width: 1280, height: 400, crop: "fill" },
        { quality: "auto" },
      ],
    });

    // Remove the original file and temp file if it exists
    fs.unlinkSync(filePath);
    if (tempFile) {
      fs.unlinkSync(tempFile);
    }

    // Update the user's wallpaper picture in the database
    const user = await User.findByIdAndUpdate(
      userId,
      {
        wallpaperPicture: result.secure_url,
        wallpaperPictureId: result.public_id, // Store the public ID for future updates/deletion
      },
      { new: true }
    ).select("-password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Return success with the updated user data
    res.status(200).json({
      success: true,
      message: "Wallpaper picture updated successfully",
      data: {
        wallpaperPicture: user.wallpaperPicture,
        user: user,
      },
    });
  } catch (error) {
    console.error("Error uploading wallpaper picture:", error);

    // Clean up the file if it exists and there was an error
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    res.status(500).json({
      success: false,
      message: "Failed to upload wallpaper picture",
      error: error.message,
    });
  }
};

/**
 * Upload base64 wallpaper to Cloudinary and update user profile
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const uploadBase64Wallpaper = async (req, res) => {
  try {
    // Check if user is authenticated
    if (!req.user || !req.user._id) {
      return res.status(401).json({
        success: false,
        message: "Authentication required. User not authenticated.",
      });
    }

    const userId = req.user.id; // Get user ID from auth middleware
    const { wallpaper } = req.body; // Expect Base64 string

    if (!wallpaper) {
      return res.status(400).json({
        success: false,
        message: "Wallpaper image is required",
      });
    }

    // Determine if base64 string is larger than ~8MB (leaving buffer below 10MB limit)
    // Base64 is roughly 4/3 the size of the binary data
    const base64Data = wallpaper.replace(/^data:image\/\w+;base64,/, "");
    const dataSize = Buffer.from(base64Data, "base64").length;

    let uploadData = wallpaper;

    // If data is too large, need to compress it
    if (dataSize > 8 * 1024 * 1024) {
      try {
        // Convert base64 to buffer
        const buffer = Buffer.from(base64Data, "base64");

        // Create a temporary file path
        const tempFilePath = `./temp-${Date.now()}.jpg`;

        // Write the buffer to a file
        fs.writeFileSync(tempFilePath, buffer);

        // Compress with sharp
        const compressedBuffer = await sharp(tempFilePath)
          .resize({ width: 1920, height: 1080, fit: "inside" })
          .jpeg({ quality: 80 })
          .toBuffer();

        // Convert back to base64
        uploadData = `data:image/jpeg;base64,${compressedBuffer.toString(
          "base64"
        )}`;

        // Clean up temp file
        fs.unlinkSync(tempFilePath);
      } catch (compressError) {
        console.error("Error compressing image:", compressError);
        // Continue with original image if compression fails
      }
    }

    // Upload base64 image to Cloudinary
    const uploadResult = await cloudinary.uploader.upload(uploadData, {
      folder: "wallpapers",
      resource_type: "auto",
      transformation: [
        { width: 1280, height: 400, crop: "fill" },
        { quality: "auto" },
      ],
    });

    // Delete previous wallpaper if exists
    if (req.user.wallpaperPictureId) {
      try {
        await cloudinary.uploader.destroy(req.user.wallpaperPictureId);
      } catch (err) {
        console.error("Error deleting previous wallpaper:", err);
        // Continue with the update even if deletion fails
      }
    }

    // Update the user's wallpaper in the database
    const user = await User.findByIdAndUpdate(
      userId,
      {
        wallpaperPicture: uploadResult.secure_url,
        wallpaperPictureId: uploadResult.public_id,
      },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Wallpaper updated successfully",
      data: {
        wallpaperPicture: user.wallpaperPicture,
        user: user,
      },
    });
  } catch (error) {
    console.error("Error updating wallpaper:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update wallpaper",
      error: error.message,
    });
  }
};
