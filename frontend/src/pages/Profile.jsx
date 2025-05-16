import React, { useState, useEffect } from "react";
import {
  CheckCircle,
  MapPin,
  Pencil,
  X,
  Upload,
  Camera,
  AtSign,
  Image,
} from "lucide-react";
import { useLocation } from "react-router-dom";
import Nav from "../components/Nav";
import ReviewList from "../components/ReviewList";
import PostSection from "../components/PostSection";
import Analytics from "../components/Analytics";
import { useSlider } from "../contexts/SliderContext";
import { useTheme } from "../components/Nav";
import api from "../utils/axios";
import { compressImage, isImageTooLarge } from "../utils/imageCompression";

// Function to generate placeholder image URL for new posts
const getDefaultPostImage = () => {
  return "https://placehold.co/600x350/red/white?text=New+Post";
};

const Profile = () => {
  const { darkMode } = useTheme();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isWallpaperModalOpen, setIsWallpaperModalOpen] = useState(false);
  const [isProfilePictureModalOpen, setIsProfilePictureModalOpen] =
    useState(false);
  const [isBioEditModalOpen, setIsBioEditModalOpen] = useState(false);
  const [profile, setProfile] = useState();
  const [connections, setConnections] = useState(0);
  const [connectionUsers, setConnectionUsers] = useState([]);
  const [userPosts, setUserPosts] = useState([]);
  const [newPost, setNewPost] = useState({
    image: null,
    imageFile: null,
    caption: "",
  });
  const [wallpaper, setWallpaper] = useState({
    image: null,
    imageFile: null,
  });
  const [profileWallpaper, setProfileWallpaper] = useState("");
  const [profilePictureEdit, setProfilePictureEdit] = useState({
    image: null,
    imageFile: null,
  });
  const [editBio, setEditBio] = useState("");
  const [loading, setLoading] = useState(true);
  const [reviews, setReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [averageRating, setAverageRating] = useState(0);
  const [statusPopup, setStatusPopup] = useState({
    show: false,
    message: "",
    type: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isWallpaperSubmitting, setIsWallpaperSubmitting] = useState(false);
  const [isProfilePictureSubmitting, setIsProfilePictureSubmitting] =
    useState(false);
  const [isBioSubmitting, setIsBioSubmitting] = useState(false);

  const location = useLocation();
  const user = location.state?.user;
  const { openConnectionsSlider } = useSlider();

  useEffect(() => {
    // If no user data is passed via location state, get current user's profile
    if (!user) {
      const fetchCurrentUser = async () => {
        try {
          setLoading(true); // Start loading
          // Get token from localStorage
          const token =
            localStorage.getItem("token") || localStorage.getItem("authToken");

          if (!token) {
            console.error("No authentication token found");
            setLoading(false);
            return;
          }

          // Extract user ID from token
          const parseJwt = (token) => {
            try {
              return JSON.parse(atob(token.split(".")[1]));
            } catch {
              return null;
            }
          };

          const decodedToken = parseJwt(token);

          if (!decodedToken || !decodedToken.id) {
            console.error("Could not extract user ID from token");
            setLoading(false);
            return;
          }

          const userId = decodedToken.id;

          // Fetch current user profile using the ID from token
          const [profileRes, connRes] = await Promise.all([
            fetch(`/api/users/profile/${userId}`, {
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
              },
            }),
            fetch(`/api/users/${userId}/connections`, {
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
              },
            }),
          ]);

          const profileData = await profileRes.json();
          const connData = await connRes.json();

          if (profileData.success) {
            setProfile(profileData.data);

            // Also fetch user posts once we have the profile
            fetchUserPosts(userId);
          } else {
            console.error("Failed to fetch profile data:", profileData.message);
          }

          if (connData.success) {
            setConnections(connData.data.totalConnections);
            setConnectionUsers(connData.data.connectionUsers || []);
          }

          // Also fetch reviews for this user
          fetchReviews(userId);

          setLoading(false); // End loading
        } catch (error) {
          console.error("Error fetching current user:", error);
          setLoading(false);
        }
      };

      fetchCurrentUser();
    } else if (user && user._id) {
      // If we have user data from location state, fetch that profile
      const fetchProfileAndConnections = async () => {
        try {
          setLoading(true); // Start loading
          const [profileRes, connRes] = await Promise.all([
            fetch(`/api/users/profile/${user._id}`),
            fetch(`/api/users/${user._id}/connections`),
          ]);

          const profileData = await profileRes.json();
          const connData = await connRes.json();

          console.log("Profile Data:", profileData);
          console.log("Connections Data:", connData);

          if (profileData.success) {
            setProfile(profileData.data);

            // Fetch user posts once we have the profile
            fetchUserPosts(user._id);
          } else {
            console.error("Failed to fetch profile data:", profileData.message);
          }

          if (connData.success) {
            setConnections(connData.data.totalConnections);
            setConnectionUsers(connData.data.connectionUsers || []);
          } else {
            console.error(
              "Failed to fetch connections data:",
              connData.message
            );
          }

          // Also fetch reviews for this user
          fetchReviews(user._id);

          setLoading(false); // End loading
        } catch (error) {
          console.error("Failed to fetch user data:", error);
          setLoading(false);
        }
      };

      fetchProfileAndConnections();
    }
  }, [user]);

  useEffect(() => {
    if (profile) {
      console.log("Profile updated:", profile);
      if (profile.wallpaperPicture) {
        setProfileWallpaper(profile.wallpaperPicture);
      }
    }
  }, [profile]);

  // Function to fetch user posts
  const fetchUserPosts = async (userId) => {
    try {
      setLoading(true);
      const token =
        localStorage.getItem("token") || localStorage.getItem("authToken");

      const postRes = await fetch(`/api/posts/userposts`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId }),
      });

      const postsData = await postRes.json();

      if (postsData.success) {
        console.log("User posts:", postsData.data);
        setUserPosts(postsData.data);
      } else {
        console.error("Failed to fetch user posts:", postsData.message);
      }

      setLoading(false);
    } catch (error) {
      console.error("Error fetching user posts:", error);
      setLoading(false);
    }
  };

  // Function to fetch reviews for a user
  const fetchReviews = async (userId) => {
    try {
      setReviewsLoading(true);

      const token =
        localStorage.getItem("token") || localStorage.getItem("authToken");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      const response = await fetch(`/api/reviews/user/${userId}`, {
        headers,
      });

      const data = await response.json();

      if (data.success) {
        // Fixed: Access reviews array from nested structure
        setReviews(data.data.reviews || []);

        // Set the average rating directly from the API response
        if (data.data && data.data.averageRating) {
          setAverageRating(data.data.averageRating);
        } else {
          setAverageRating(0);
        }

        console.log("Reviews fetched:", data.data.reviews);
      } else {
        console.error("Failed to fetch reviews:", data.message);
      }
    } catch (error) {
      console.error("Error fetching reviews:", error);
    } finally {
      setReviewsLoading(false);
    }
  };

  const handleImageChange = async (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];

      // Set preview immediately with original file
      setNewPost({
        ...newPost,
        image: URL.createObjectURL(file),
      });

      try {
        // Check if image is too large and show a message
        if (isImageTooLarge(file)) {
          console.log(
            `Image is large (${(file.size / 1024 / 1024).toFixed(
              2
            )}MB), compressing...`
          );
        }

        // Compress the image
        const compressedFile = await compressImage(file);

        // Update state with compressed file
        setNewPost((prev) => ({
          ...prev,
          imageFile: compressedFile,
        }));
      } catch (err) {
        console.error("Error compressing image:", err);
        // Fallback to original file if compression fails
        setNewPost((prev) => ({
          ...prev,
          imageFile: file,
        }));
      }
    }
  };

  const handleCaptionChange = (e) => {
    setNewPost({
      ...newPost,
      caption: e.target.value,
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    // Disable submit button immediately
    setIsSubmitting(true);

    const token =
      localStorage.getItem("token") || localStorage.getItem("authToken");

    if (!token) {
      console.error("No authentication token found");
      setIsSubmitting(false);
      return;
    }

    // Get user ID from token
    const parseJwt = (token) => {
      try {
        return JSON.parse(atob(token.split(".")[1]));
      } catch {
        return null;
      }
    };

    const decodedToken = parseJwt(token);

    if (!decodedToken || !decodedToken.id) {
      console.error("Could not extract user ID from token");
      setIsSubmitting(false);
      return;
    }

    try {
      let imageUrl;

      // First, upload the image if we have one
      if (newPost.imageFile) {
        const formData = new FormData();
        formData.append("image", newPost.imageFile);

        const uploadResponse = await fetch("/api/uploads/image", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            // Don't set Content-Type for FormData
          },
          body: formData,
        });

        const uploadData = await uploadResponse.json();

        if (!uploadData.success) {
          console.error("Failed to upload image:", uploadData.message);
          alert("Failed to upload image. Please try again.");
          setIsSubmitting(false);
          return;
        }

        imageUrl = uploadData.imageUrl;
      } else {
        imageUrl = getDefaultPostImage();
      }

      // Create post data with the Cloudinary URL
      const postData = {
        caption: newPost.caption,
        author: decodedToken.id,
        media: [
          {
            type: "image",
            url: imageUrl,
            altText: "",
          },
        ],
        visibility: "public",
      };

      // Send post data to backend
      const response = await fetch("/api/posts", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(postData),
      });

      const data = await response.json();

      if (data.success) {
        console.log("Post created successfully:", data);
        // Update posts list
        fetchUserPosts(decodedToken.id);
        // Reset form and close modal
        setIsModalOpen(false);
        setNewPost({ image: null, imageFile: null, caption: "" });
      } else {
        console.error("Failed to create post:", data.message);
        alert("Failed to create post. Please try again.");
      }
    } catch (error) {
      console.error("Error creating post:", error);
      alert("Error creating post. Please check your connection and try again.");
    } finally {
      // Re-enable submit button
      setIsSubmitting(false);
    }
  };

  // Function to handle wallpaper image change
  const handleWallpaperChange = async (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];

      // Set preview immediately with original file
      setWallpaper({
        image: URL.createObjectURL(file),
      });

      try {
        // Check if image is too large and show a message
        if (isImageTooLarge(file)) {
          console.log(
            `Wallpaper is large (${(file.size / 1024 / 1024).toFixed(
              2
            )}MB), compressing...`
          );
        }

        // Compress the image
        const compressedFile = await compressImage(file);

        // Update state with compressed file
        setWallpaper((prev) => ({
          ...prev,
          imageFile: compressedFile,
        }));
      } catch (err) {
        console.error("Error compressing wallpaper:", err);
        // Fallback to original file if compression fails
        setWallpaper((prev) => ({
          ...prev,
          imageFile: file,
        }));
      }
    }
  };

  // Function to submit wallpaper change
  const handleWallpaperSubmit = async (event) => {
    event.preventDefault();

    // Prevent double submissions
    setIsWallpaperSubmitting(true);

    let token =
      localStorage.getItem("token") || localStorage.getItem("authToken");

    // Ensure token exists and has the correct format
    if (!token) {
      console.error("No authentication token found");
      alert("Authentication required. Please log in again.");
      setIsWallpaperSubmitting(false);
      return;
    }

    // Make sure token has "Bearer " prefix for the Authorization header
    if (!token.startsWith("Bearer ")) {
      token = `Bearer ${token}`;
    }

    try {
      // Upload the wallpaper image
      if (wallpaper.imageFile) {
        const formData = new FormData();
        formData.append("wallpaper", wallpaper.imageFile);

        // Get user ID from token (remove "Bearer " prefix if it exists)
        const parseJwt = (token) => {
          try {
            const tokenContent = token.startsWith("Bearer ")
              ? token.split(" ")[1]
              : token;
            return JSON.parse(atob(tokenContent.split(".")[1]));
          } catch (error) {
            console.error("Error parsing JWT token:", error);
            return null;
          }
        };

        const decodedToken = parseJwt(token);

        if (!decodedToken || !decodedToken.id) {
          console.error("Could not extract user ID from token");
          alert("Authentication issue. Please log in again.");
          return;
        }

        const userId = decodedToken.id;
        console.log("Using userId for wallpaper upload:", userId);

        // Upload to cloudinary via the backend
        const uploadResponse = await fetch(`/api/uploads/wallpaper/${userId}`, {
          method: "POST",
          headers: {
            Authorization: token,
          },
          body: formData,
        });

        const uploadData = await uploadResponse.json();

        if (!uploadData.success) {
          console.error("Failed to upload wallpaper:", uploadData.message);
          alert("Failed to upload wallpaper. Please try again.");
          return;
        }

        // The API already updates the user profile, so we just need to update the local state
        setProfile({
          ...profile,
          wallpaperPicture: uploadData.data.wallpaperPicture,
        });
        setProfileWallpaper(uploadData.data.wallpaperPicture);

        // Close modal and reset form
        setIsWallpaperModalOpen(false);
        setWallpaper({ image: null, imageFile: null });
      }
    } catch (error) {
      console.error("Error updating wallpaper:", error);
      alert(
        "Error updating wallpaper. Please check your connection and try again."
      );
    } finally {
      setIsWallpaperSubmitting(false);
    }
  };

  // Function to handle profile picture change
  const handleProfilePictureChange = async (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];

      // Set preview immediately with original file
      setProfilePictureEdit({
        image: URL.createObjectURL(file),
      });

      try {
        // Check if image is too large and show a message
        if (isImageTooLarge(file)) {
          console.log(
            `Profile picture is large (${(file.size / 1024 / 1024).toFixed(
              2
            )}MB), compressing...`
          );
        }

        // Compress the image
        const compressedFile = await compressImage(file);

        // Update state with compressed file
        setProfilePictureEdit((prev) => ({
          ...prev,
          imageFile: compressedFile,
        }));
      } catch (err) {
        console.error("Error compressing profile picture:", err);
        // Fallback to original file if compression fails
        setProfilePictureEdit((prev) => ({
          ...prev,
          imageFile: file,
        }));
      }
    }
  };

  // Function to submit profile picture change
  const handleProfilePictureSubmit = async (event) => {
    event.preventDefault();

    // Prevent double submissions
    setIsProfilePictureSubmitting(true);

    let token =
      localStorage.getItem("token") || localStorage.getItem("authToken");

    if (!token) {
      console.error("No authentication token found");
      alert("Authentication required. Please log in again.");
      setIsProfilePictureSubmitting(false);
      return;
    }

    if (!token.startsWith("Bearer ")) {
      token = `Bearer ${token}`;
    }

    try {
      if (profilePictureEdit.imageFile) {
        const formData = new FormData();
        formData.append("profilePicture", profilePictureEdit.imageFile);

        // Get user ID from token
        const parseJwt = (token) => {
          try {
            const tokenContent = token.startsWith("Bearer ")
              ? token.split(" ")[1]
              : token;
            return JSON.parse(atob(tokenContent.split(".")[1]));
          } catch (error) {
            console.error("Error parsing JWT token:", error);
            return null;
          }
        };

        const decodedToken = parseJwt(token);

        if (!decodedToken || !decodedToken.id) {
          console.error("Could not extract user ID from token");
          alert("Authentication issue. Please log in again.");
          return;
        }

        const userId = decodedToken.id;
        console.log("Using userId for profile picture upload:", userId);

        // Upload to cloudinary via the backend
        const uploadResponse = await fetch(
          `/api/uploads/profile-picture/${userId}`,
          {
            method: "POST",
            headers: {
              Authorization: token,
            },
            body: formData,
          }
        );

        const uploadData = await uploadResponse.json();

        if (!uploadData.success) {
          console.error(
            "Failed to upload profile picture:",
            uploadData.message
          );
          alert("Failed to upload profile picture. Please try again.");
          return;
        }

        // Update the local profile state
        setProfile({
          ...profile,
          profilePicture: uploadData.data.profilePicture,
        });

        // Close modal and reset form
        setIsProfilePictureModalOpen(false);
        setProfilePictureEdit({ image: null, imageFile: null });
      }
    } catch (error) {
      console.error("Error updating profile picture:", error);
      alert(
        "Error updating profile picture. Please check your connection and try again."
      );
    } finally {
      setIsProfilePictureSubmitting(false);
    }
  };

  // Function to handle bio update
  const handleBioSubmit = async (event) => {
    event.preventDefault();

    // Prevent double submissions
    setIsBioSubmitting(true);

    let token =
      localStorage.getItem("token") || localStorage.getItem("authToken");

    if (!token) {
      console.error("No authentication token found");
      alert("Authentication required. Please log in again.");
      setIsBioSubmitting(false);
      return;
    }

    if (!token.startsWith("Bearer ")) {
      token = `Bearer ${token}`;
    }

    try {
      // Get user ID from token
      const parseJwt = (token) => {
        try {
          const tokenContent = token.startsWith("Bearer ")
            ? token.split(" ")[1]
            : token;
          return JSON.parse(atob(tokenContent.split(".")[1]));
        } catch (error) {
          console.error("Error parsing JWT token:", error);
          return null;
        }
      };

      const decodedToken = parseJwt(token);

      if (!decodedToken || !decodedToken.id) {
        console.error("Could not extract user ID from token");
        alert("Authentication issue. Please log in again.");
        return;
      }

      const userId = decodedToken.id;

      const response = await fetch(`/api/users/profile/${userId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: token,
        },
        body: JSON.stringify({
          bio: editBio,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to update bio");
      }

      // Update the local profile state
      setProfile({
        ...profile,
        bio: editBio,
      });

      // Close modal and reset form
      setIsBioEditModalOpen(false);
    } catch (error) {
      console.error("Error updating bio:", error);
      alert("Failed to update bio. Please try again.");
    } finally {
      setIsBioSubmitting(false);
    }
  };

  // Connections click handler
  const handleConnectionsClick = () => {
    const userId = profile?._id;
    console.log("Profile: handleConnectionsClick called with userId:", userId);
    if (userId) {
      openConnectionsSlider(userId);
    } else {
      console.log("Profile: No userId available for connections slider");
    }
  };

  // Function to delete a post
  const handleDeletePost = async (postId) => {
    try {
      if (!postId) {
        console.error("No post ID provided for deletion");
        setStatusPopup({
          show: true,
          message: "Error: Post ID is missing",
          type: "error",
        });
        return;
      }

      setLoading(true);

      // Get current user ID from profile
      const userId = profile?._id;
      if (!userId) {
        console.error("No user ID available");
        setStatusPopup({
          show: true,
          message: "User ID is missing. Please try again.",
          type: "error",
        });
        setLoading(false);
        return;
      }

      console.log("Deleting post with ID:", postId, "for user:", userId);

      // Make API call to delete the post using the axios instance
      const response = await api.post("/posts/delete", { postId, userId });
      const data = response.data;

      if (data.success) {
        console.log("Post deleted successfully:", data);

        // Update the posts list by removing the deleted post
        setUserPosts(userPosts.filter((post) => post._id !== postId));

        // Show success message
        setStatusPopup({
          show: true,
          message: "Post deleted successfully!",
          type: "success",
        });

        // Close the popup after 3 seconds
        setTimeout(() => {
          setStatusPopup({ show: false, message: "", type: "" });
        }, 3000);
      } else {
        console.error("Failed to delete post:", data.message);
        setStatusPopup({
          show: true,
          message: data.message || "Failed to delete post. Please try again.",
          type: "error",
        });
      }
    } catch (error) {
      console.error("Error deleting post:", error);
      setStatusPopup({
        show: true,
        message:
          error.response?.data?.message ||
          "Error deleting post. Please check your connection and try again.",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading || !profile) {
    return (
      <div className={`min-h-screen ${darkMode ? "bg-gray-900" : "bg-gray-50"}`}>
        {/* Keep the Nav bar visible */}
        <Nav />

        {/* Main Content - with the same layout as the loaded page */}
        <div className={`sm:ml-64 min-h-screen overflow-y-auto ${
          darkMode ? "bg-gray-800" : "bg-gray-100"
        } flex justify-center items-center`}>
          <div className="flex flex-col items-center">
            <div className="flex space-x-3 mb-5">
              <div
                className="w-4 h-4 rounded-full grad animate-bounce shadow-md"
                style={{ animationDelay: "0ms" }}
              ></div>
              <div
                className="w-4 h-4 rounded-full grad animate-bounce shadow-md"
                style={{ animationDelay: "200ms" }}
              ></div>
              <div
                className="w-4 h-4 rounded-full grad animate-bounce shadow-md"
                style={{ animationDelay: "400ms" }}
              ></div>
            </div>
            <p className={`${darkMode ? "text-gray-200" : "text-gray-700"} font-medium text-lg`}>
              Loading profile...
            </p>
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className={`min-h-screen ${darkMode ? "bg-gray-900" : "bg-gray-50"}`}>
      {/* Nav Bar */}
      <Nav />

      {/* Main Content - adjusted to not overlap with Nav */}
      <div className={`sm:ml-64 min-h-screen overflow-y-auto ${
        darkMode ? "bg-gray-800" : "bg-gray-100"
      }`}>
        {/* Profile Section */}

        <div className={`max-w-4xl mx-auto my-6 ${
          darkMode ? "bg-gray-800" : "bg-white"
        } rounded-lg shadow-md p-6`}>
          <div className="h-48 relative overflow-hidden rounded-t-lg">
            {/* Wallpaper Background */}
            {profileWallpaper ? (
              <img
                src={profileWallpaper}
                alt="Profile Wallpaper"
                className="absolute inset-0 w-full h-full object-cover rounded-t-lg"
              />
            ) : (
              <div className={`absolute inset-0 ${
                darkMode ? "bg-gray-700" : "bg-black opacity-10"
              } rounded-t-lg`}></div>
            )}

            {/* Wallpaper overlay with gradient */}
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black opacity-40 rounded-t-lg"></div>

            <div className="absolute inset-0">
              <div className="absolute top-0 left-0 w-1/3 h-px bg-red-300 opacity-30"></div>
              <div className="absolute bottom-0 left-0 w-px h-1/4 bg-blue-300 opacity-30"></div>
              <div className="absolute bottom-0 right-0 w-1/3 h-px bg-teal-300 opacity-30"></div>
              <div className="absolute top-1/2 right-1/4 w-64 h-64 rounded-full border border-pink-200 opacity-20"></div>
              <div className="absolute bottom-0 right-0 w-64 h-64 border-t border-l border-gray-300 opacity-20"></div>

              {/* Small dots pattern */}
              <div
                className="absolute inset-0"
                style={{
                  backgroundImage:
                    `radial-gradient(circle, ${darkMode ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.2)'} 1px, transparent 1px)`,
                  backgroundSize: "20px 20px",
                }}
              ></div>
            </div>

            {/* Username on Wallpaper - Hidden on small screens */}
            <div className="absolute bottom-0 left-32 right-0 p-4 text-white hidden sm:block">
              <h1 className="text-4xl font-bold">
                {profile.firstName || profile.lastName
                  ? `${profile.firstName || ""} ${
                      profile.lastName || ""
                    }`.trim()
                  : profile.username}
              </h1>
            </div>

            {/* Edit Wallpaper Button */}
            <button
              onClick={() => setIsWallpaperModalOpen(true)}
              className={`absolute top-4 right-4 p-2 rounded-full ${
                darkMode 
                  ? "bg-gray-800 bg-opacity-70 hover:bg-opacity-80" 
                  : "bg-white bg-opacity-40 hover:bg-opacity-60"
              } transition-all duration-300 cursor-pointer shadow-md z-10`}
              title="Edit wallpaper"
            >
              <Image size={20} className={darkMode ? "text-gray-200" : "text-gray-800"} />
            </button>
          </div>

          <div className="relative px-6 py-3">
            {/* Profile Picture with Edit Icon on Hover */}
            <div className={`absolute -top-16 left-6 rounded-full ${
              darkMode ? "border-gray-700" : "border-white"
            } border-4 overflow-hidden group`}>
              <img
                src={
                  profile.profilePicture ||
                  `https://placehold.co/150/green/white?text=${
                    profile.username ? profile.username.charAt(0) : "U"
                  }`
                }
                alt="Profile"
                className="w-24 h-24 object-cover"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = `https://placehold.co/150/green/white?text=${
                    profile.username ? profile.username.charAt(0) : "U"
                  }`;
                }}
              />
              <div
                className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                onClick={() => setIsProfilePictureModalOpen(true)}
              >
                <Camera size={24} className="text-white" />
              </div>
            </div>

            {/* Profile Info - Below the avatar */}
            <div className="mt-8">
              <div className="flex items-center mb-0.5">
                <h2 className={`text-xl font-bold ${
                  darkMode ? "text-white" : "text-gray-800"
                }`}>
                  {profile.username}
                </h2>
                {profile.isVerified && (
                  <CheckCircle
                    size={18}
                    className="ml-2 text-blue-600 fill-blue-600"
                  />
                )}
              </div>

              {/* Bio with Edit Icon on Hover */}
              <div className="relative group">
                <p className={`${
                  darkMode ? "text-gray-300" : "text-gray-700"
                } text-sm mt-0.5 mb-1 max-w-lg inline-block`}>
                  {profile.bio || "No bio provided"}
                </p>
                <div
                  className="inline-block ml-2 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer align-middle"
                  onClick={() => {
                    setEditBio(profile.bio || "");
                    setIsBioEditModalOpen(true);
                  }}
                >
                  <Pencil
                    size={14}
                    className={`${
                      darkMode ? "text-gray-400 hover:text-gray-200" : "text-gray-500 hover:text-gray-700"
                    }`}
                  />
                </div>
              </div>

              <div className={`flex items-center ${
                darkMode ? "text-gray-400" : "text-gray-600"
              } mt-1`}>
                <AtSign size={16} className="mr-1" />
                <span className="mr-3">
                  {profile.email || "No email provided"}
                </span>
              </div>

              <div className={`flex items-center ${
                darkMode ? "text-gray-400" : "text-gray-600"
              } mt-1`}>
                <MapPin size={16} className="mr-1" />
                <span>
                  {profile.location &&
                  (profile.location.city || profile.location.country)
                    ? `${profile.location.city ? profile.location.city : ""}${
                        profile.location.city && profile.location.country
                          ? ", "
                          : ""
                      }${
                        profile.location.country ? profile.location.country : ""
                      }`
                    : "No location specified"}
                </span>
                <div className="flex items-center ml-2">
                  <span
                    className="text-blue-600 font-medium cursor-pointer hover:underline"
                    onClick={handleConnectionsClick}
                  >
                    · Connections {connections}
                  </span>

                  {/* Connection Avatars */}
                  {connectionUsers.length > 0 && (
                    <div className="flex -space-x-2 ml-2">
                      {connectionUsers.map((user) => (
                        <div
                          key={user._id}
                          className={`w-6 h-6 rounded-full ${
                            darkMode ? "border-gray-700" : "border-white"
                          } border overflow-hidden`}
                          title={
                            user.firstName && user.lastName
                              ? `${user.firstName} ${user.lastName}`
                              : user.username
                          }
                        >
                          <img
                            src={
                              user.profilePicture ||
                              "https://via.placeholder.com/100"
                            }
                            alt={user.username}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ))}
                      {connections > connectionUsers.length && (
                        <div className={`w-6 h-6 rounded-full ${
                          darkMode 
                            ? "border-gray-700 bg-gray-600 text-gray-200" 
                            : "border-white bg-gray-200 text-gray-600"
                        } border flex items-center justify-center text-xs`}>
                          +{connections - connectionUsers.length}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Analytics Section with responsive padding */}
        <div className="px-2 sm:px-6 py-2">
          <Analytics userId={profile._id} />
        </div>

        {/* Reviews Section with responsive padding */}
        <div className="px-2 sm:px-6 py-2">
          <ReviewList
            reviews={reviews}
            isLoading={reviewsLoading}
            averageRating={averageRating}
          />
        </div>

        {/* Posts Section with responsive padding */}
        <div className="px-2 sm:px-6 py-2">
          <PostSection
            posts={userPosts}
            onCreate={() => setIsModalOpen(true)}
            onDelete={handleDeletePost}
          />
        </div>
        {isModalOpen && <div>Your modal component goes here</div>}
      </div>

      {/* Create New Post Modal */}
      {isModalOpen && (
        <div className={`fixed inset-0 ${
          darkMode 
            ? "bg-gradient-to-b from-gray-900/60 to-gray-800/40" 
            : "bg-gradient-to-b from-white/60 to-gray-400/40"
        } backdrop-filter backdrop-blur-[4px] flex items-center justify-center z-50`}>
          <div className={`${
            darkMode ? "bg-gray-800/95" : "bg-white/95"
          } rounded-lg shadow-xl w-full max-w-md p-6 relative`}>
            {/* Close button */}
            <button
              onClick={() => {
                setIsModalOpen(false);
                setNewPost({ image: null, imageFile: null, caption: "" });
              }}
              className={`absolute top-3 right-3 ${
                darkMode ? "text-gray-400 hover:text-gray-200" : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <X size={20} />
            </button>

            <h3 className={`text-xl font-bold ${
              darkMode ? "text-white" : "text-gray-900"
            } mb-4`}>
              Create New Post
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Image Upload Area */}
              <div className={`border-2 border-dashed ${
                darkMode ? "border-gray-700 bg-gray-700" : "border-gray-300 bg-gray-50"
              } rounded-lg p-6 flex flex-col items-center justify-center`}>
                {newPost.image ? (
                  <div className="relative w-full">
                    <img
                      src={newPost.image}
                      alt="Selected"
                      className="w-full h-48 object-cover rounded-md"
                    />
                    <button
                      type="button"
                      onClick={() => setNewPost({ ...newPost, image: null })}
                      className={`absolute top-2 right-2 ${
                        darkMode 
                          ? "bg-gray-800 bg-opacity-70 text-gray-300 hover:text-red-400" 
                          : "bg-white bg-opacity-70 text-gray-700 hover:text-red-500"
                      } rounded-full p-1`}
                    >
                      <X size={16} />
                    </button>
                  </div>
                ) : (
                  <>
                    <Upload size={40} className={darkMode ? "text-gray-400" : "text-gray-400"} />
                    <p className={`text-sm ${darkMode ? "text-gray-300" : "text-gray-500"} mb-2`}>Upload image</p>
                    <p className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-400"} mb-4`}>
                      PNG, JPG or GIF (max. 5MB)
                    </p>
                    <label className="cursor-pointer bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium">
                      Select Image
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="hidden"
                      />
                    </label>
                  </>
                )}
              </div>

              {/* Caption Input */}
              <div>
                <label htmlFor="caption" className={`block text-sm font-medium ${
                  darkMode ? "text-gray-300" : "text-gray-700"
                } mb-1`}>
                  Caption
                </label>
                <textarea
                  id="caption"
                  rows="3"
                  placeholder="Write a caption for your post..."
                  className={`w-full ${
                    darkMode 
                      ? "bg-gray-700 border-gray-600 text-white" 
                      : "bg-white border-gray-300 text-gray-900"
                  } placeholder:text-gray-400 border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500`}
                  value={newPost.caption}
                  onChange={handleCaptionChange}
                />
              </div>

              {/* Submit Button */}
              <div className="flex justify-end">
                <button
                  type="submit"
                  className="grad text-white px-4 py-2 rounded-md text-sm font-medium shadow-sm hover:shadow-md transition duration-300 disabled:opacity-50 flex items-center space-x-2"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                      <span>Posting...</span>
                    </>
                  ) : (
                    <span>Create Post</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Wallpaper Update Modal */}
      {isWallpaperModalOpen && (
        <div className={`fixed inset-0 ${
          darkMode 
            ? "bg-gradient-to-b from-gray-900/60 to-gray-800/40" 
            : "bg-gradient-to-b from-white/60 to-gray-400/40"
        } backdrop-filter backdrop-blur-[4px] flex items-center justify-center z-50`}>
          <div className={`${
            darkMode ? "bg-gray-800/95" : "bg-white/95"
          } rounded-lg shadow-xl w-full max-w-md p-6 relative`}>
            {/* Close button */}
            <button
              onClick={() => {
                setIsWallpaperModalOpen(false);
                setWallpaper({ image: null, imageFile: null });
              }}
              className={`absolute top-3 right-3 ${
                darkMode ? "text-gray-400 hover:text-gray-200" : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <X size={20} />
            </button>

            <h3 className={`text-xl font-bold ${
              darkMode ? "text-white" : "text-gray-900"
            } mb-4`}>
              Update Profile Wallpaper
            </h3>

            <form onSubmit={handleWallpaperSubmit} className="space-y-4">
              {/* Image Upload Area */}
              <div className={`border-2 border-dashed ${
                darkMode ? "border-gray-700 bg-gray-700" : "border-gray-300 bg-gray-50"
              } rounded-lg p-6 flex flex-col items-center justify-center`}>
                {wallpaper.image ? (
                  <div className="relative w-full">
                    <img
                      src={wallpaper.image}
                      alt="Selected Wallpaper"
                      className="w-full h-48 object-cover rounded-md"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setWallpaper({
                          ...wallpaper,
                          image: null,
                          imageFile: null,
                        })
                      }
                      className={`absolute top-2 right-2 ${
                        darkMode 
                          ? "bg-gray-800 bg-opacity-70 text-gray-300 hover:text-red-400" 
                          : "bg-white bg-opacity-70 text-gray-700 hover:text-red-500"
                      } rounded-full p-1`}
                    >
                      <X size={16} />
                    </button>
                  </div>
                ) : (
                  <>
                    <Image size={40} className={darkMode ? "text-gray-400" : "text-gray-400"} />
                    <p className={`text-sm ${darkMode ? "text-gray-300" : "text-gray-500"} mb-2`}>
                      Upload wallpaper image
                    </p>
                    <p className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-400"} mb-4`}>
                      PNG, JPG or GIF (recommended resolution: 1280x400)
                    </p>
                    <label className="cursor-pointer bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium">
                      Select Image
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleWallpaperChange}
                        className="hidden"
                      />
                    </label>
                  </>
                )}
              </div>

              {/* Submit Button */}
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setIsWallpaperModalOpen(false);
                    setWallpaper({ image: null, imageFile: null });
                  }}
                  className={`mr-2 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md ${
                    darkMode ? "bg-gray-800 bg-opacity-70 hover:bg-opacity-80" : "bg-white bg-opacity-40 hover:bg-opacity-60"
                  }`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!wallpaper.image || isWallpaperSubmitting}
                  className={`px-4 py-2 text-sm font-medium text-white rounded-md ${
                    wallpaper.image && !isWallpaperSubmitting
                      ? "bg-blue-600 hover:bg-blue-700 cursor-pointer"
                      : "bg-blue-400 cursor-not-allowed"
                  }`}
                >
                  {isWallpaperSubmitting ? "Saving..." : "Save Wallpaper"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Profile Picture Update Modal */}
      {isProfilePictureModalOpen && (
        <div className={`fixed inset-0 ${
          darkMode 
            ? "bg-gradient-to-b from-gray-900/60 to-gray-800/40" 
            : "bg-gradient-to-b from-white/60 to-gray-400/40"
        } backdrop-filter backdrop-blur-[4px] flex items-center justify-center z-50`}>
          <div className={`${
            darkMode ? "bg-gray-800/95" : "bg-white/95"
          } rounded-lg shadow-xl w-full max-w-md p-6 relative`}>
            {/* Close button */}
            <button
              onClick={() => {
                setIsProfilePictureModalOpen(false);
                setProfilePictureEdit({ image: null, imageFile: null });
              }}
              className={`absolute top-3 right-3 ${
                darkMode ? "text-gray-400 hover:text-gray-200" : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <X size={20} />
            </button>

            <h3 className={`text-xl font-bold ${
              darkMode ? "text-white" : "text-gray-900"
            } mb-4`}>
              Update Profile Picture
            </h3>

            <form onSubmit={handleProfilePictureSubmit} className="space-y-4">
              {/* Image Upload Area */}
              <div className={`border-2 border-dashed ${
                darkMode ? "border-gray-700 bg-gray-700" : "border-gray-300 bg-gray-50"
              } rounded-lg p-6 flex flex-col items-center justify-center`}>
                {profilePictureEdit.image ? (
                  <div className="relative w-full">
                    <img
                      src={profilePictureEdit.image}
                      alt="Selected Profile"
                      className="w-32 h-32 object-cover rounded-full mx-auto"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setProfilePictureEdit({
                          ...profilePictureEdit,
                          image: null,
                          imageFile: null,
                        })
                      }
                      className={`absolute top-0 right-0 bg-white bg-opacity-70 rounded-full p-1 text-gray-700 hover:text-red-500`}
                    >
                      <X size={16} />
                    </button>
                  </div>
                ) : (
                  <>
                    <Camera size={40} className={darkMode ? "text-gray-400" : "text-gray-400"} />
                    <p className={`text-sm ${darkMode ? "text-gray-300" : "text-gray-500"} mb-2`}>
                      Upload profile photo
                    </p>
                    <p className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-400"} mb-4`}>
                      PNG, JPG or GIF (max. 5MB)
                    </p>
                    <label className="cursor-pointer bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium">
                      Select Image
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleProfilePictureChange}
                        className="hidden"
                      />
                    </label>
                  </>
                )}
              </div>

              {/* Submit Button */}
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setIsProfilePictureModalOpen(false);
                    setProfilePictureEdit({ image: null, imageFile: null });
                  }}
                  className={`mr-2 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md ${
                    darkMode ? "bg-gray-800 bg-opacity-70 hover:bg-opacity-80" : "bg-white bg-opacity-40 hover:bg-opacity-60"
                  }`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={
                    !profilePictureEdit.image || isProfilePictureSubmitting
                  }
                  className={`px-4 py-2 text-sm font-medium text-white rounded-md ${
                    profilePictureEdit.image && !isProfilePictureSubmitting
                      ? "bg-blue-600 hover:bg-blue-700 cursor-pointer"
                      : "bg-blue-400 cursor-not-allowed"
                  }`}
                >
                  {isProfilePictureSubmitting
                    ? "Saving..."
                    : "Save Profile Picture"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bio Edit Modal */}
      {isBioEditModalOpen && (
        <div className={`fixed inset-0 ${
          darkMode 
            ? "bg-gradient-to-b from-gray-900/60 to-gray-800/40" 
            : "bg-gradient-to-b from-white/60 to-gray-400/40"
        } backdrop-filter backdrop-blur-[4px] flex items-center justify-center z-50`}>
          <div className={`${
            darkMode ? "bg-gray-800/95" : "bg-white/95"
          } rounded-lg shadow-xl w-full max-w-md p-6 relative`}>
            {/* Close button */}
            <button
              onClick={() => setIsBioEditModalOpen(false)}
              className={`absolute top-3 right-3 ${
                darkMode ? "text-gray-400 hover:text-gray-200" : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <X size={20} />
            </button>

            <h3 className={`text-xl font-bold ${
              darkMode ? "text-white" : "text-gray-900"
            } mb-4`}>Edit Bio</h3>

            <form onSubmit={handleBioSubmit} className="space-y-4">
              {/* Bio Input */}
              <div>
                <label
                  htmlFor="bio"
                  className={`block text-sm font-medium ${
                    darkMode ? "text-gray-300" : "text-gray-700"
                  } mb-1`}
                >
                  Bio
                </label>
                <textarea
                  id="bio"
                  rows="4"
                  value={editBio}
                  onChange={(e) => setEditBio(e.target.value)}
                  placeholder="Tell us about yourself..."
                  className={`w-full ${
                    darkMode 
                      ? "bg-gray-700 border-gray-600 text-white" 
                      : "bg-white border-gray-300 text-gray-900"
                  } placeholder:text-gray-400 border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500`}
                  maxLength="100"
                ></textarea>
                <p className={`text-xs ${
                  darkMode ? "text-gray-400" : "text-gray-500"
                } text-right mt-1`}>
                  {editBio.length}/100 characters
                </p>
              </div>

              {/* Submit Button */}
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setIsBioEditModalOpen(false)}
                  className={`mr-2 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md ${
                    darkMode ? "bg-gray-800 bg-opacity-70 hover:bg-opacity-80" : "bg-white bg-opacity-40 hover:bg-opacity-60"
                  }`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`px-4 py-2 text-sm font-medium text-white rounded-md ${
                    isBioSubmitting
                      ? "bg-blue-400 cursor-not-allowed"
                      : "bg-blue-600 hover:bg-blue-700 cursor-pointer"
                  }`}
                  disabled={isBioSubmitting}
                >
                  {isBioSubmitting ? "Saving..." : "Save Bio"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Status Popup for success and error messages */}
      {statusPopup.show && (
        <div
          className={`fixed bottom-5 right-5 max-w-md px-6 py-4 rounded-lg shadow-lg z-50 transition-all duration-300 ${
            statusPopup.type === "success"
              ? "bg-green-50 border-l-4 border-green-500 text-green-700"
              : "bg-red-50 border-l-4 border-red-500 text-red-700"
          }`}
        >
          <div className="flex items-center space-x-3">
            {statusPopup.type === "success" ? (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6 text-green-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6 text-red-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            )}
            <p className="font-medium">{statusPopup.message}</p>
            <button
              onClick={() =>
                setStatusPopup({ show: false, message: "", type: "" })
              }
              className="ml-auto -mx-1.5 -my-1.5 rounded-lg focus:ring-2 focus:ring-gray-400 p-1.5 inline-flex h-8 w-8 hover:bg-gray-200"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;
