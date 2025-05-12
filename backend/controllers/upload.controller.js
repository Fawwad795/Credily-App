import fs from "fs";
import { uploadBase64Image as uploadBase64 } from "../utils/imageUpload.js";
import cloudinary from "../config/cloudinary.js";

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
