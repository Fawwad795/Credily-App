/**
 * Compresses an image file using canvas rendering to reduce file size
 * @param {File} file - The original image file
 * @param {Object} options - Compression options
 * @param {number} options.maxSizeMB - Maximum size in MB
 * @param {number} options.maxWidthOrHeight - Maximum width or height in pixels
 * @param {number} options.quality - JPEG quality (0-1)
 * @returns {Promise<File>} - A promise that resolves to a compressed file
 */
export const compressImage = async (file, options = {}) => {
  // Default options
  const {
    maxSizeMB = 9, // Set to 9MB by default to provide buffer before 10MB limit
    maxWidthOrHeight = 1920,
    quality = 0.7,
    mimeType = file.type || "image/jpeg",
  } = options;

  // File size check - if already smaller than max size, return the file
  if (file.size / 1024 / 1024 < maxSizeMB) {
    console.log("File already under size limit, no compression needed");
    return file;
  }

  return new Promise((resolve, reject) => {
    try {
      const reader = new FileReader();
      reader.onload = function (event) {
        const img = new Image();
        img.onload = function () {
          // Calculate initial scale based on file size
          const sizeRatio = file.size / (maxSizeMB * 1024 * 1024);
          let initialScale = 1;
          let initialQuality = quality;

          // Adjust scale and quality based on how much the file exceeds the limit
          if (sizeRatio > 10) {
            initialScale = 0.3;
            initialQuality = 0.5;
          } else if (sizeRatio > 5) {
            initialScale = 0.5;
            initialQuality = 0.6;
          } else if (sizeRatio > 2) {
            initialScale = 0.7;
            initialQuality = 0.65;
          }

          // Try compression with progressively lower quality
          attemptCompression(img, initialScale, initialQuality, 5);
        };
        img.src = event.target.result;
      };
      reader.readAsDataURL(file);

      // Function to attempt compression with reducing quality
      function attemptCompression(img, scale, currentQuality, attemptsLeft) {
        // Calculate dimensions
        let width = img.width * scale;
        let height = img.height * scale;

        // Apply max width/height constraint
        if (width > height) {
          if (width > maxWidthOrHeight) {
            height = Math.round((height * maxWidthOrHeight) / width);
            width = maxWidthOrHeight;
          }
        } else {
          if (height > maxWidthOrHeight) {
            width = Math.round((width * maxWidthOrHeight) / height);
            height = maxWidthOrHeight;
          }
        }

        // Create canvas
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");

        // Draw with white background for transparent images
        ctx.fillStyle = "#FFFFFF";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Draw image
        ctx.drawImage(img, 0, 0, width, height);

        // Convert to blob
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error("Canvas to Blob conversion failed"));
              return;
            }

            // Create file from blob
            const compressedFile = new File([blob], file.name, {
              type: mimeType,
              lastModified: Date.now(),
            });

            console.log(
              `Original: ${(file.size / 1024 / 1024).toFixed(2)}MB, ` +
                `Compressed: ${(compressedFile.size / 1024 / 1024).toFixed(
                  2
                )}MB, ` +
                `Scale: ${scale.toFixed(2)}, Quality: ${currentQuality.toFixed(
                  2
                )}, ` +
                `Dimensions: ${width}x${height}`
            );

            // If still too large and we have attempts left, try again
            if (
              compressedFile.size / 1024 / 1024 > maxSizeMB &&
              attemptsLeft > 0
            ) {
              // Calculate new parameters for next attempt
              let newQuality = currentQuality;
              let newScale = scale;

              // Aggressive reduction based on how far we still are from target
              const remainingRatio =
                compressedFile.size / (maxSizeMB * 1024 * 1024);

              if (remainingRatio > 2) {
                // Still way too big, reduce both quality and scale
                newQuality = Math.max(0.1, currentQuality - 0.2);
                newScale = scale * 0.7;
              } else {
                // Just reduce quality
                newQuality = Math.max(0.1, currentQuality - 0.1);
              }

              // Try again with new parameters
              attemptCompression(img, newScale, newQuality, attemptsLeft - 1);
            } else {
              if (compressedFile.size / 1024 / 1024 > maxSizeMB) {
                console.warn(
                  `Warning: Compressed to ${(
                    compressedFile.size /
                    1024 /
                    1024
                  ).toFixed(2)}MB ` +
                    `but still exceeds the ${maxSizeMB}MB limit after ${
                      5 - attemptsLeft
                    } attempts`
                );
              }
              resolve(compressedFile);
            }
          },
          mimeType,
          currentQuality
        );
      }
    } catch (error) {
      console.error("Image compression error:", error);
      reject(error);
    }
  });
};

/**
 * Helper function to check if an image is too large
 * @param {File} file - The image file to check
 * @param {number} maxSizeMB - Maximum size in MB
 * @returns {boolean} - True if file is too large
 */
export const isImageTooLarge = (file, maxSizeMB = 10) => {
  return file && file.size / 1024 / 1024 > maxSizeMB;
};
