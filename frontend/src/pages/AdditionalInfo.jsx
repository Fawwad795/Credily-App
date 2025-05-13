import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import background from "../assets/background.png";

const AdditionalInfo = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const user = location.state?.user;

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [bio, setBio] = useState("");
  const [location_, setLocation] = useState("");
  const [profileImage, setProfileImage] = useState(null);
  const [profileImagePreview, setProfileImagePreview] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // If no user data is passed, redirect to signup
  if (!user) {
    navigate("/signup");
    return null;
  }

  const validateEmail = (email) => {
    if (!email) return true; // Email is optional, so empty is fine
    const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
    return emailRegex.test(email);
  };

  const handleEmailChange = (e) => {
    const value = e.target.value;
    setEmail(value);

    if (value && !validateEmail(value)) {
      setEmailError(
        "Please enter a valid email address (e.g., name@example.com)"
      );
    } else {
      setEmailError("");
    }
  };

  // Function to compress image
  const compressImage = (file) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = function (event) {
        const img = new Image();
        img.onload = function () {
          // Create canvas
          const canvas = document.createElement("canvas");

          // Calculate new dimensions (max 800px width/height for more aggressive compression)
          let width = img.width;
          let height = img.height;
          const maxSize = 800;

          if (width > height && width > maxSize) {
            height = Math.round((height * maxSize) / width);
            width = maxSize;
          } else if (height > maxSize) {
            width = Math.round((width * maxSize) / height);
            height = maxSize;
          }

          canvas.width = width;
          canvas.height = height;

          // Draw image on canvas
          const ctx = canvas.getContext("2d");
          ctx.drawImage(img, 0, 0, width, height);

          // Convert to Blob
          canvas.toBlob(
            (blob) => {
              // Create a new file from the blob
              const compressedFile = new File([blob], file.name, {
                type: "image/jpeg",
                lastModified: Date.now(),
              });

              // If still too large, compress more
              if (compressedFile.size > 9 * 1024 * 1024) {
                // If still over 9MB
                // Create another canvas with even smaller dimensions
                const canvas2 = document.createElement("canvas");
                const maxSize2 = 600; // Even smaller

                let width2 = width;
                let height2 = height;

                if (width2 > height2 && width2 > maxSize2) {
                  height2 = Math.round((height2 * maxSize2) / width2);
                  width2 = maxSize2;
                } else if (height2 > maxSize2) {
                  width2 = Math.round((width2 * maxSize2) / height2);
                  height2 = maxSize2;
                }

                canvas2.width = width2;
                canvas2.height = height2;

                const ctx2 = canvas2.getContext("2d");
                ctx2.drawImage(img, 0, 0, width2, height2);

                canvas2.toBlob(
                  (blob2) => {
                    const moreCompressedFile = new File([blob2], file.name, {
                      type: "image/jpeg",
                      lastModified: Date.now(),
                    });
                    resolve(moreCompressedFile);
                  },
                  "image/jpeg",
                  0.5
                ); // Even lower quality for large images
              } else {
                resolve(compressedFile);
              }
            },
            "image/jpeg",
            0.6
          ); // Lower quality from 0.7 to 0.6
        };
        img.src = event.target.result;
      };
      reader.readAsDataURL(file);
    });
  };

  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      // Show preview with original file
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileImagePreview(reader.result);
      };
      reader.readAsDataURL(file);

      // Compress image before setting it for upload
      try {
        const compressedFile = await compressImage(file);
        console.log(
          `Original size: ${(file.size / 1024 / 1024).toFixed(
            2
          )}MB, Compressed size: ${(compressedFile.size / 1024 / 1024).toFixed(
            2
          )}MB`
        );
        setProfileImage(compressedFile);
      } catch (err) {
        console.error("Error compressing image:", err);
        setProfileImage(file); // Fallback to original if compression fails
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // Validate email before submission
    if (email && !validateEmail(email)) {
      setEmailError(
        "Please enter a valid email address (e.g., name@example.com)"
      );
      return;
    }

    setLoading(true);

    try {
      // First, update the user's additional info
      const response = await fetch(
        `/api/users/profile/${user._id}/additional-info`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            firstName,
            lastName,
            email,
            bio,
            location: location_,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        // Check if it's a duplicate email error
        if (data.error === "duplicate_email") {
          setEmailError(
            "This email is already in use by another account. Please use a different email."
          );
          setLoading(false);
          return;
        }

        throw new Error(
          data.message || "Failed to update additional information"
        );
      }

      let updatedUser = data.data;

      // If profile image is selected, upload it to Cloudinary
      if (profileImage) {
        const formData = new FormData();
        formData.append("profilePicture", profileImage);

        const uploadResponse = await fetch(
          `/api/uploads/profile-picture/${user._id}`,
          {
            method: "POST",
            body: formData,
          }
        );

        const uploadData = await uploadResponse.json();

        if (!uploadResponse.ok) {
          console.error(
            "Failed to upload profile picture:",
            uploadData.message
          );
          // Continue anyway since the profile info was updated successfully
        } else {
          // Update the user data with the new profile picture
          updatedUser = uploadData.data.user;
        }
      }

      alert("Profile setup completed successfully!");
      navigate("/profile", { state: { user: updatedUser } });
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center bg-cover bg-center"
      style={{
        backgroundImage: `url(${background})`,
        backgroundSize: "120%",
        backgroundRepeat: "no-repeat",
        backgroundPosition: "center",
      }}
    >
      <div className="p-8 rounded-lg shadow-2xl glass w-full max-w-md">
        <h2 className="text-3xl font-bold mb-6 text-center text-black">
          Complete Your Profile
        </h2>

        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center">
                {profileImagePreview ? (
                  <img
                    src={profileImagePreview}
                    alt="Profile preview"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-gray-400 text-4xl">👤</span>
                )}
              </div>
              <label
                htmlFor="profile-upload"
                className="absolute bottom-0 right-0 bg-purple-500 text-white p-1 rounded-full cursor-pointer"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                  />
                </svg>
                <input
                  type="file"
                  id="profile-upload"
                  className="hidden"
                  accept="image/*"
                  onChange={handleImageChange}
                />
              </label>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-black font-medium mb-2">
                First Name
              </label>
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg glass text-gray-800 focus:outline-none focus:ring-2 focus:ring-purple-400"
                placeholder="First Name"
              />
            </div>
            <div>
              <label className="block text-black font-medium mb-2">
                Last Name
              </label>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg glass text-gray-800 focus:outline-none focus:ring-2 focus:ring-purple-400"
                placeholder="Last Name"
              />
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-black font-medium mb-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={handleEmailChange}
              className={`w-full px-4 py-2 border rounded-lg glass text-gray-800 focus:outline-none focus:ring-2 ${
                emailError
                  ? "border-red-500 focus:ring-red-400"
                  : "focus:ring-purple-400"
              }`}
              placeholder="Your email address"
            />
            {emailError && (
              <p className="text-red-500 text-xs mt-1">{emailError}</p>
            )}
          </div>

          <div className="mb-4">
            <label className="block text-black font-medium mb-2">
              Location
            </label>
            <input
              type="text"
              value={location_}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg glass text-gray-800 focus:outline-none focus:ring-2 focus:ring-purple-400"
              placeholder="Your location"
            />
          </div>

          <div className="mb-6">
            <label className="block text-black font-medium mb-2">Bio</label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg glass text-gray-800 focus:outline-none focus:ring-2 focus:ring-purple-400"
              placeholder="Tell us about yourself"
              rows="3"
              maxLength="300"
            ></textarea>
            <p className="text-xs text-gray-500 mt-1">
              {bio.length}/300 characters
            </p>
          </div>

          <button
            type="submit"
            disabled={loading || emailError}
            className={`w-full grad text-white py-2 px-4 rounded-lg transition duration-300 ${
              loading || emailError
                ? "opacity-60 cursor-not-allowed"
                : "hover:bg-purple-600"
            }`}
          >
            {loading ? "Saving..." : "Complete Setup"}
          </button>

          <p className="text-center text-black mt-4">
            <button
              type="button"
              onClick={() => navigate("/profile", { state: { user } })}
              className="text-purple-900 hover:underline"
            >
              Skip for now
            </button>
          </p>
        </form>
      </div>
    </div>
  );
};

export default AdditionalInfo;
