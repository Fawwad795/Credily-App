import cloudinary from "../config/cloudinary.js";
import { promises as fs } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Upload image to Cloudinary from base64 data
 * @param {string} base64Image - Base64 encoded image
 * @param {string} folder - Folder to upload to in Cloudinary
 * @returns {Promise<Object>} Cloudinary upload result
 */
export const uploadBase64Image = async (base64Image, folder = "posts") => {
  try {
    // Upload directly to Cloudinary using base64
    const result = await cloudinary.uploader.upload(base64Image, {
      folder,
      resource_type: "auto",
    });

    return {
      success: true,
      url: result.secure_url,
      public_id: result.public_id,
    };
  } catch (error) {
    console.error("Error uploading image to Cloudinary:", error);
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * Uploads image from a buffer to Cloudinary
 * @param {Buffer} buffer - Image buffer
 * @param {string} folder - Folder to upload to in Cloudinary
 * @returns {Promise<Object>} Cloudinary upload result
 */
export const uploadBufferImage = async (buffer, folder = "posts") => {
  try {
    // Create a temporary file from buffer
    const tempPath = path.join(__dirname, "..", "temp", `${Date.now()}.jpg`);

    // Ensure temp directory exists
    await fs.mkdir(path.dirname(tempPath), { recursive: true });

    // Write buffer to temp file
    await fs.writeFile(tempPath, buffer);

    // Upload to Cloudinary
    const result = await cloudinary.uploader.upload(tempPath, {
      folder,
      resource_type: "auto",
    });

    // Clean up temp file
    await fs.unlink(tempPath);

    return {
      success: true,
      url: result.secure_url,
      public_id: result.public_id,
    };
  } catch (error) {
    console.error("Error uploading image to Cloudinary:", error);
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * Delete image from Cloudinary
 * @param {string} publicId - Cloudinary public ID
 * @returns {Promise<Object>} Cloudinary deletion result
 */
export const deleteImage = async (publicId) => {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    return {
      success: true,
      result,
    };
  } catch (error) {
    console.error("Error deleting image from Cloudinary:", error);
    return {
      success: false,
      error: error.message,
    };
  }
};
