import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { AtSign, MapPin } from "lucide-react";
import Nav from "../components/Nav"; // Adjust the path to your Nav component
import PostCard from "../components/PostCard"; // Import PostCard component

const Follow = () => {
  const { id } = useParams(); // Get the user ID from URL params
  const [isFollowing, setIsFollowing] = useState(false); // State to track follow status
  const [isPendingRequest, setIsPendingRequest] = useState(false); // State to track pending follow requests
  const [pendingRequestId, setPendingRequestId] = useState(null); // Store pending request ID for cancellation
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [postsCount, setPostsCount] = useState(0);
  const [userPosts, setUserPosts] = useState([]); // Add state for user posts
  const [connectionUsers, setConnectionUsers] = useState([]); // Add state for connection users with profile pics
  const [reviewContent, setReviewContent] = useState("");
  const [reviewError, setReviewError] = useState("");
  const [reviewSuccess, setReviewSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState({
    hasDirectConnection: false,
    hasMutualConnections: false,
    mutualConnectionsCount: 0,
  });
  const [userData, setUserData] = useState({
    username: "",
    email: "",
    firstName: "",
    lastName: "",
    profilePicture: "",
    wallpaperPicture: "",
    bio: "",
    location: "",
    phoneNumber: "",
  });
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [sentiment, setSentiment] = useState({
    sentimentLabel: "neutral",
    score: 0,
    magnitude: 0,
  });
  const [typingTimeout, setTypingTimeout] = useState(null);

  const navigate = useNavigate();

  const fetchUserData = useCallback(async () => {
    try {
      console.log("Fetching user data for ID:", id);

      // Add authorization token to the request
      const token =
        localStorage.getItem("token") || localStorage.getItem("authToken");
      const headers = token
        ? {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          }
        : { "Content-Type": "application/json" };

      // Updated to use the correct API endpoint based on backend routes
      const response = await fetch(`/api/users/profile/${id}`, {
        headers: headers,
      });

      const data = await response.json();

      console.log("User data response:", data);

      if (response.ok && data.success) {
        // Set all fields from the data object, using fallbacks if properties are missing
        const profile = data.data || {};

        setUserData({
          username: profile.username || "User",
          email: profile.email || "email@example.com",
          firstName: profile.firstName || "",
          lastName: profile.lastName || "",
          profilePicture: profile.profilePicture || "",
          wallpaperPicture: profile.wallpaperPicture || "",
          bio: profile.bio || "No bio available",
          location: profile.location || "",
          phoneNumber: profile.phoneNumber || "",
        });

        console.log("User data set:", profile);
      } else {
        console.error("Failed to fetch user data:", data.message);
        // Set an error state or show notification to user
        alert(
          `Error fetching user profile: ${data.message || "Unknown error"}`
        );
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
      // Set an error state or show notification to user
      alert("Error fetching user profile. Please try again later.");
    }
  }, [id]);

  // Check if the current user is connected to this profile
  const checkConnectionStatus = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      // Call the API endpoint to check connection status
      const response = await fetch(`/api/users/connections/${id}/status`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        console.log("Connection status:", data);

        if (data.success && data.data) {
          // Update isFollowing based on direct connection status
          setIsFollowing(data.data.isConnected);

          // Store full connection status for later use
          setConnectionStatus({
            hasDirectConnection: data.data.hasDirectConnection,
            hasMutualConnections: data.data.hasMutualConnections,
            mutualConnectionsCount: data.data.mutualConnectionsCount,
          });

          // Log to console for debugging
          if (data.data.isConnected) {
            console.log("Users are directly connected");
          }

          if (data.data.hasMutualConnections) {
            console.log(
              `Users have ${data.data.mutualConnectionsCount} mutual connections`
            );
          }
        }
      } else {
        console.error("Failed to fetch connection status");
      }
    } catch (error) {
      console.error("Error checking connection status:", error);
    }
  }, [id]);

  // Check if there's a pending follow request
  const checkPendingRequest = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const response = await fetch(`/api/users/connections/${id}/pending`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();

        if (data.success) {
          setIsPendingRequest(data.data.isPending);
          if (data.data.isPending && data.data.connectionId) {
            setPendingRequestId(data.data.connectionId);
          }
        }
      } else {
        console.error("Failed to check pending request status");
      }
    } catch (error) {
      console.error("Error checking pending request:", error);
    }
  }, [id]);

  // Fetch connection counts
  const fetchConnectionsCount = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      // Fetch followers count
      const followersResponse = await fetch(`/api/users/${id}/connections`, {
        headers,
      });

      if (followersResponse.ok) {
        const followersData = await followersResponse.json();
        if (followersData.success && followersData.data) {
          setFollowersCount(followersData.data.totalConnections || 0);
          // Store connection users with their profile pictures
          setConnectionUsers(followersData.data.connectionUsers || []);
        }
      }

      // Fetch following count using the new endpoint
      const followingResponse = await fetch(`/api/users/${id}/following`, {
        headers,
      });

      if (followingResponse.ok) {
        const followingData = await followingResponse.json();
        if (followingData.success && followingData.data) {
          setFollowingCount(followingData.data.totalFollowing || 0);
        } else {
          // If data structure is unexpected
          console.error("Invalid following data structure", followingData);
          setFollowingCount(0);
        }
      } else {
        // If endpoint returns an error
        console.error("Failed to fetch following count");
        setFollowingCount(0);
      }
    } catch (error) {
      console.error("Error fetching connection counts:", error);
      // Fallback values
      setFollowersCount(0);
      setFollowingCount(0);
      setConnectionUsers([]);
    }
  }, [id]);

  // Function to fetch user posts
  const fetchUserPosts = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");

      // Use the same endpoint as Profile page
      const response = await fetch(`/api/posts/userposts`, {
        method: "POST",
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId: id }),
      });

      const postsData = await response.json();

      if (postsData.success) {
        console.log("User posts:", postsData.data);
        setUserPosts(postsData.data || []);
        setPostsCount(postsData.data ? postsData.data.length : 0);
      } else {
        console.error("Failed to fetch user posts:", postsData.message);
        setUserPosts([]);
        setPostsCount(0);
      }
    } catch (error) {
      console.error("Error fetching user posts:", error);
      setUserPosts([]);
      setPostsCount(0);
    }
  }, [id]);

  useEffect(() => {
    // Fetch user data when component mounts
    if (id) {
      fetchUserData();
      checkConnectionStatus();
      fetchConnectionsCount();
      checkPendingRequest();
      fetchUserPosts(); // Add this to directly fetch posts
    }
  }, [
    id,
    fetchUserData,
    checkConnectionStatus,
    fetchConnectionsCount,
    checkPendingRequest,
    fetchUserPosts,
  ]);

  const handleFollow = async () => {
    try {
      // Get token from localStorage
      const token = localStorage.getItem("token");

      if (!token) {
        alert("You must be logged in to follow users!");
        return;
      }

      if (isFollowing) {
        // Call API to remove the connection (unfollow)
        const response = await fetch(`/api/users/connections/${id}/remove`, {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await response.json();

        if (response.ok) {
          // Update UI state
          setFollowersCount(followersCount - 1);
          setIsFollowing(false);
          // Reset connection status
          setConnectionStatus({
            hasDirectConnection: false,
            hasMutualConnections: false,
            mutualConnectionsCount: 0,
          });
        } else {
          console.error("Failed to unfollow user:", data.message);
          alert(data.message || "Failed to unfollow user");
        }
      } else if (isPendingRequest) {
        if (!pendingRequestId) {
          // Reset the state to allow following again
          setIsPendingRequest(false);
          return;
        }

        try {
          // Cancel the pending request
          const response = await fetch(
            `/api/users/connections/${pendingRequestId}/cancel`,
            {
              method: "DELETE",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
            }
          );

          // Regardless of the response data, if we get a 200 status code, consider it successful
          if (response.status === 200) {
            // Immediately update UI state
            setIsPendingRequest(false);
            setPendingRequestId(null);
            return;
          }

          // Try to parse the response for error message
          try {
            const data = await response.json();

            if (data.success) {
              setIsPendingRequest(false);
              setPendingRequestId(null);
            } else {
              console.error("Failed to cancel follow request:", data.message);
              alert(data.message || "Failed to cancel follow request");
            }
          } catch (parseError) {
            console.error("Error parsing cancel response:", parseError);
            // Even if parsing fails, if status was 200, consider it successful
            if (response.ok) {
              setIsPendingRequest(false);
              setPendingRequestId(null);
            } else {
              alert("Failed to cancel follow request. Please try again.");
            }
          }
        } catch (fetchError) {
          console.error("Network error cancelling follow request:", fetchError);
          alert("Network error. Please check your connection and try again.");
        }
      } else {
        // Send connection request to follow the user
        const response = await fetch("/api/users/connections", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            recipientId: id,
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();

          try {
            const data = JSON.parse(errorText);
            console.error("Failed to follow user:", data.message);
            alert(data.message || "Failed to follow user");
          } catch (e) {
            console.error("Could not parse error response:", e);
            alert(
              "Failed to follow user. Server returned an invalid response."
            );
          }
          return;
        }

        const data = await response.json();

        // Check if we have a successful response
        if (data.success) {
          // Immediately update the UI regardless of the backend notification status
          setIsPendingRequest(true);

          // Store the connection ID for potential cancellation
          if (data.data && data.data._id) {
            setPendingRequestId(data.data._id);
          }
        } else {
          console.error("Failed to follow user:", data.message);
          alert(data.message || "Failed to follow user");
        }
      }
    } catch (error) {
      console.error("Error in handleFollow:", error);
      alert("An error occurred while trying to follow/unfollow this user");
    }
  };

  const handleMessageClick = () => {
    navigate("/messages", {
      state: {
        userId: id,
        username: userData.username,
        email: userData.email,
        profilePicture: userData.profilePicture,
      },
    });
  };

  // Get appropriate button text based on connection state
  const getFollowButtonText = () => {
    if (isFollowing) return "Unfollow";
    if (isPendingRequest) return "Follow Request Sent";
    return "Follow";
  };

  // Get appropriate button class based on connection state
  const getFollowButtonClass = () => {
    if (isFollowing) {
      return "bg-gray-300 text-gray-700";
    }
    if (isPendingRequest) {
      return "bg-yellow-500 text-white hover:bg-yellow-600";
    }
    return "bg-blue-500 text-white hover:bg-blue-600";
  };

  const categoryOptions = [
    "trustworthiness",
    "communication",
    "reliability",
    "helpfulness",
    "other",
  ];

  const toggleCategory = (category) => {
    if (selectedCategories.includes(category)) {
      setSelectedCategories(
        selectedCategories.filter((cat) => cat !== category)
      );
    } else {
      setSelectedCategories([...selectedCategories, category]);
    }
  };

  const handleReviewSubmit = async () => {
    // Reset states
    setReviewError("");
    setReviewSuccess("");

    // Validate review content
    if (!reviewContent.trim()) {
      setReviewError("Review content is required!");
      return;
    }

    if (reviewContent.length < 5) {
      setReviewError("Review content must be at least 5 characters!");
      return;
    }

    // Validate at least one category is selected
    if (selectedCategories.length === 0) {
      setReviewError("Please select at least one category!");
      return;
    }

    try {
      setLoading(true);

      // Get token from localStorage
      const token = localStorage.getItem("token");

      if (!token) {
        setReviewError("You must be logged in to leave a review!");
        return;
      }

      const response = await fetch("/api/reviews/leave", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          revieweeId: id,
          content: reviewContent,
          categories: selectedCategories,
          isAnonymous: false,
          isPublic: true,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message);
      }

      // Clear the form and show success message
      setReviewContent("");
      setSelectedCategories([]);
      setReviewSuccess("Review submitted successfully!");
    } catch (error) {
      setReviewError(error.message || "Failed to submit review.");
    } finally {
      setLoading(false);
    }
  };

  // Determine if the current user can write a review
  const canWriteReview = () => {
    // Can write review if they have a direct connection OR mutual connections
    return isFollowing || connectionStatus.hasMutualConnections;
  };

  // Add this function to analyze sentiment in real-time
  const analyzeReviewSentiment = async (content) => {
    if (!content || content.trim().length < 5) {
      setSentiment({
        sentimentLabel: "neutral",
        score: 0,
        magnitude: 0,
      });
      return;
    }

    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const response = await fetch("/api/reviews/analyze-sentiment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ content }),
      });

      const data = await response.json();

      if (data.success) {
        setSentiment(data.data);
      }
    } catch (error) {
      console.error("Error analyzing sentiment:", error);
    }
  };

  // Update handleReviewContent to include sentiment analysis
  const handleReviewContentChange = (e) => {
    const content = e.target.value;
    setReviewContent(content);

    // Clear any existing timeout
    if (typingTimeout) {
      clearTimeout(typingTimeout);
    }

    // Set a new timeout to delay API calls until user stops typing
    const timeoutId = setTimeout(() => {
      analyzeReviewSentiment(content);
    }, 500); // 500ms delay

    setTypingTimeout(timeoutId);
  };

  // Helper function to generate a placeholder avatar for connections without a profile picture
  const generateAvatar = (username) => {
    const colors = ["blue", "teal", "green", "orange", "red", "purple"];
    // Use a simple hash of the username to pick a consistent color
    const colorIndex = username
      ? username.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0) %
        colors.length
      : Math.floor(Math.random() * colors.length);
    const color = colors[colorIndex];
    const initial = username ? username.charAt(0).toUpperCase() : "?";
    return `https://placehold.co/50/${color}/white?text=${initial}`;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation on the side */}
      <Nav />

      {/* Main Content - adjusted to not overlap with Nav */}
      <div className="sm:ml-64 min-h-screen">
        {/* Profile Header */}
        <div className="w-full h-48 relative overflow-hidden">
          {/* Wallpaper Background */}
          {userData.wallpaperPicture ? (
            <img
              src={userData.wallpaperPicture}
              alt="Profile Wallpaper"
              className="absolute inset-0 w-full h-full object-cover"
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-indigo-800"></div>
          )}

          {/* Wallpaper overlay with gradient */}
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black opacity-40"></div>

          {/* Small dots pattern */}
          <div
            className="absolute inset-0"
            style={{
              backgroundImage:
                "radial-gradient(circle, rgba(255,255,255,0.2) 1px, transparent 1px)",
              backgroundSize: "20px 20px",
            }}
          ></div>

          {/* Center content container */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className="w-24 h-24 rounded-full bg-gray-200 overflow-hidden ring-gradient">
              {userData.profilePicture ? (
                <img
                  src={userData.profilePicture}
                  alt={userData.username}
                  className="w-full h-full rounded-full object-cover"
                  onError={(e) => {
                    e.target.onerror = null;
                    const initial = userData.username
                      ? userData.username.charAt(0).toUpperCase()
                      : "U";
                    e.target.src = `https://placehold.co/150/purple/white?text=${initial}`;
                  }}
                />
              ) : (
                <img
                  src={`https://placehold.co/150/purple/white?text=${
                    userData.username
                      ? userData.username.charAt(0).toUpperCase()
                      : "U"
                  }`}
                  alt={userData.username}
                  className="w-full h-full rounded-full object-cover"
                />
              )}
            </div>

            {/* User's full name below profile picture */}
            <div className="mt-3 text-center">
              <h1 className="text-xl font-bold text-white">
                {userData.firstName || userData.lastName
                  ? `${userData.firstName || ""} ${
                      userData.lastName || ""
                    }`.trim()
                  : userData.username || "User"}
              </h1>
            </div>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-4 py-6">
          {/* Profile Info */}
          <div className="glass shadow-lg rounded-lg p-6 w-full">
            <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
              <div>
                {/* Username */}
                <div className="flex items-center mb-0.5">
                  <h2 className="text-xl font-bold text-gray-800">
                    {userData.username || "User"}
                  </h2>
                </div>

                {/* Bio */}
                <div className="relative">
                  <p className="text-gray-700 text-sm mt-0.5 mb-1 max-w-lg">
                    {userData.bio || "No bio available"}
                  </p>
                </div>

                {/* Email */}
                <div className="flex items-center text-gray-600 mt-1">
                  <AtSign size={16} className="mr-1" />
                  <span className="mr-3">
                    {userData.email || "email@example.com"}
                  </span>
                </div>

                {/* Location with Connections */}
                <div className="flex items-center text-gray-600 mt-1">
                  <MapPin size={16} className="mr-1" />
                  <span>
                    {userData.location && typeof userData.location === "object"
                      ? `${
                          userData.location.city ? userData.location.city : ""
                        }${
                          userData.location.city && userData.location.country
                            ? ", "
                            : ""
                        }${
                          userData.location.country
                            ? userData.location.country
                            : ""
                        }`
                      : userData.location || "Location not specified"}
                  </span>

                  {/* Connections inline with location */}
                  <div className="flex items-center ml-2">
                    <span className="text-blue-600 font-medium cursor-pointer">
                      · Connections {followersCount}
                    </span>

                    {/* Connection Avatars */}
                    {connectionUsers.length > 0 && (
                      <div className="flex -space-x-2 ml-2">
                        {connectionUsers.map((user) => (
                          <div
                            key={user._id}
                            className="w-6 h-6 rounded-full border border-white overflow-hidden"
                            title={
                              user.firstName && user.lastName
                                ? `${user.firstName} ${user.lastName}`
                                : user.username
                            }
                          >
                            <img
                              src={
                                user.profilePicture ||
                                generateAvatar(user.username)
                              }
                              alt={user.username}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = generateAvatar(user.username);
                              }}
                            />
                          </div>
                        ))}
                        {followersCount > connectionUsers.length && (
                          <div className="w-6 h-6 rounded-full border border-white bg-gray-200 flex items-center justify-center text-xs text-gray-600">
                            +{followersCount - connectionUsers.length}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={handleFollow}
                  className={`px-6 py-2 rounded-full font-medium ${getFollowButtonClass()}`}
                >
                  {getFollowButtonText()}
                </button>
                <button
                  className="grad text-white px-6 py-2 rounded-full hover:shadow-lg font-medium transition-shadow"
                  onClick={handleMessageClick}
                >
                  Message
                </button>
              </div>
            </div>

            {/* Stats */}
            <div className="flex justify-around mt-8 p-4 bg-white rounded-lg shadow-sm">
              <div className="text-center">
                <h3 className="text-2xl font-bold">{followersCount}</h3>
                <p className="text-gray-600">Followers</p>
              </div>
              <div className="text-center">
                <h3 className="text-2xl font-bold">{followingCount}</h3>
                <p className="text-gray-600">Following</p>
              </div>
              <div className="text-center">
                <h3 className="text-2xl font-bold">{postsCount}</h3>
                <p className="text-gray-600">Posts</p>
              </div>
            </div>
          </div>

          {/* Conditional Sections based on Follow Status */}
          {isFollowing ? (
            <>
              {/* Posts Section - Only show when following */}
              <div className="glass shadow-lg rounded-lg mt-6 p-6 w-full">
                <h3 className="text-xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-red-600">
                  Posts
                </h3>
                {userPosts.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6 mt-4">
                    {userPosts.map((post, index) => (
                      <div
                        key={post._id || index}
                        className="transform transition duration-300 hover:scale-[1.01]"
                      >
                        <PostCard
                          authorId={post.author?._id || id}
                          authorName={
                            post.author?.username ||
                            userData.username ||
                            "Anonymous"
                          }
                          authorImage={
                            post.author?.profilePicture ||
                            userData.profilePicture ||
                            `https://placehold.co/50/gray/white?text=${
                              userData.username?.charAt(0) || "A"
                            }`
                          }
                          postImage={
                            post.media && post.media.length > 0
                              ? post.media[0].url
                              : "https://placehold.co/600x350/gray/white?text=No+Image"
                          }
                          postCaption={post.caption}
                          comments={
                            post.comments
                              ? post.comments.map((comment) => comment.content)
                              : []
                          }
                          postDate={post.createdAt}
                          postId={post._id}
                          likesCount={post.totalLikes || 0}
                        />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-500">
                      This user hasn't posted anything yet.
                    </p>
                  </div>
                )}
              </div>

              {/* Leave a Review Section - Only show when following or have mutual connections */}
              {canWriteReview() && (
                <div className="glass shadow-lg rounded-lg mt-6 p-6 w-full transform transition-all duration-300 hover:shadow-xl">
                  <h3 className="text-2xl font-bold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-red-600">
                    Leave a Review
                  </h3>

                  {/* Connection Status Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    {connectionStatus.hasDirectConnection && (
                      <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200 shadow-sm flex items-center">
                        <div className="bg-blue-100 text-blue-600 p-2 rounded-full mr-3">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={1.5}
                            stroke="currentColor"
                            className="w-5 h-5"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z"
                            />
                          </svg>
                        </div>
                        <p className="text-blue-800 font-medium">
                          You are directly connected with this user
                        </p>
                      </div>
                    )}

                    {connectionStatus.hasMutualConnections && (
                      <div className="p-4 bg-gradient-to-r from-green-50 to-teal-50 rounded-xl border border-green-200 shadow-sm flex items-center">
                        <div className="bg-green-100 text-green-600 p-2 rounded-full mr-3">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={1.5}
                            stroke="currentColor"
                            className="w-5 h-5"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z"
                            />
                          </svg>
                        </div>
                        <p className="text-green-800 font-medium">
                          <span className="font-bold">
                            {connectionStatus.mutualConnectionsCount}
                          </span>{" "}
                          mutual connection
                          {connectionStatus.mutualConnectionsCount !== 1 && "s"}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Category Selection */}
                  <div className="mb-8">
                    <label className="block text-gray-700 mb-2 font-medium">
                      What aspects are you reviewing?
                    </label>
                    <div className="flex flex-wrap gap-3 p-1">
                      {categoryOptions.map((category) => {
                        const isSelected =
                          selectedCategories.includes(category);
                        let bgColor, textColor, hoverBg, hoverText;

                        switch (category) {
                          case "trustworthiness":
                            bgColor = isSelected ? "bg-blue-600" : "bg-blue-50";
                            textColor = isSelected
                              ? "text-white"
                              : "text-blue-700";
                            hoverBg = "hover:bg-blue-500";
                            hoverText = "hover:text-white";
                            break;
                          case "communication":
                            bgColor = isSelected
                              ? "bg-purple-600"
                              : "bg-purple-50";
                            textColor = isSelected
                              ? "text-white"
                              : "text-purple-700";
                            hoverBg = "hover:bg-purple-500";
                            hoverText = "hover:text-white";
                            break;
                          case "reliability":
                            bgColor = isSelected
                              ? "bg-green-600"
                              : "bg-green-50";
                            textColor = isSelected
                              ? "text-white"
                              : "text-green-700";
                            hoverBg = "hover:bg-green-500";
                            hoverText = "hover:text-white";
                            break;
                          case "helpfulness":
                            bgColor = isSelected
                              ? "bg-amber-600"
                              : "bg-amber-50";
                            textColor = isSelected
                              ? "text-white"
                              : "text-amber-700";
                            hoverBg = "hover:bg-amber-500";
                            hoverText = "hover:text-white";
                            break;
                          case "other":
                            bgColor = isSelected ? "bg-gray-600" : "bg-gray-50";
                            textColor = isSelected
                              ? "text-white"
                              : "text-gray-700";
                            hoverBg = "hover:bg-gray-500";
                            hoverText = "hover:text-white";
                            break;
                          default:
                            bgColor = isSelected
                              ? "bg-indigo-600"
                              : "bg-indigo-50";
                            textColor = isSelected
                              ? "text-white"
                              : "text-indigo-700";
                            hoverBg = "hover:bg-indigo-500";
                            hoverText = "hover:text-white";
                        }

                        return (
                          <button
                            key={category}
                            type="button"
                            onClick={() => toggleCategory(category)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${bgColor} ${textColor} ${
                              !isSelected && `${hoverBg} ${hoverText}`
                            } shadow-sm transform hover:-translate-y-1 flex items-center`}
                          >
                            {isSelected && (
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                                strokeWidth={1.5}
                                stroke="currentColor"
                                className="w-4 h-4 mr-1"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  d="M4.5 12.75l6 6 9-13.5"
                                />
                              </svg>
                            )}
                            {category.charAt(0).toUpperCase() +
                              category.slice(1)}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Review Text Area */}
                  <div className="mb-6">
                    <label className="block text-gray-700 mb-2 font-medium">
                      Your Review:
                    </label>
                    <div className="relative">
                      <textarea
                        rows="5"
                        className="w-full px-5 py-4 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400 shadow-sm transition-all duration-200 text-gray-700"
                        placeholder="Share your experience with this user..."
                        value={reviewContent}
                        onChange={handleReviewContentChange}
                      ></textarea>
                      <div className="absolute bottom-3 right-3 text-xs text-gray-400">
                        {reviewContent.length} characters
                      </div>
                    </div>

                    {/* Sentiment Indicator */}
                    {reviewContent.length >= 5 && (
                      <div className="mt-3 flex items-center">
                        <span className="text-gray-700 mr-2 text-sm">
                          Sentiment:
                        </span>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${
                            sentiment.sentimentLabel === "critically positive"
                              ? "bg-green-100 text-green-800"
                              : sentiment.sentimentLabel === "positive"
                              ? "bg-green-50 text-green-600"
                              : sentiment.sentimentLabel === "neutral"
                              ? "bg-gray-100 text-gray-600"
                              : sentiment.sentimentLabel === "negative"
                              ? "bg-red-50 text-red-600"
                              : "bg-red-100 text-red-800" // critically negative
                          }`}
                        >
                          {sentiment.sentimentLabel
                            .split(" ")
                            .map(
                              (word) =>
                                word.charAt(0).toUpperCase() + word.slice(1)
                            )
                            .join(" ")}
                        </span>

                        {/* Visual sentiment meter */}
                        <div className="ml-auto flex items-center">
                          <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className={`h-full ${
                                sentiment.score > 0
                                  ? "bg-gradient-to-r from-green-300 to-green-500"
                                  : sentiment.score < 0
                                  ? "bg-gradient-to-r from-red-300 to-red-500"
                                  : "bg-gray-400"
                              }`}
                              style={{
                                width: `${Math.abs(sentiment.score) * 100}%`,
                                marginLeft:
                                  sentiment.score >= 0
                                    ? "50%"
                                    : `${50 - Math.abs(sentiment.score) * 50}%`,
                              }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Error Message */}
                  {reviewError && (
                    <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 mb-4 rounded-md animate-pulse">
                      <div className="flex items-center">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth={1.5}
                          stroke="currentColor"
                          className="w-5 h-5 mr-2"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
                          />
                        </svg>
                        <p>{reviewError}</p>
                      </div>
                    </div>
                  )}

                  {/* Success Message */}
                  {reviewSuccess && (
                    <div className="bg-green-50 border-l-4 border-green-500 text-green-700 p-4 mb-4 rounded-md animate-pulse">
                      <div className="flex items-center">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth={1.5}
                          stroke="currentColor"
                          className="w-5 h-5 mr-2"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        <p>{reviewSuccess}</p>
                      </div>
                    </div>
                  )}

                  <button
                    className="mt-4 w-full sm:w-auto grad text-white py-3 px-8 rounded-xl hover:shadow-lg hover:scale-105 transition-all duration-300 font-medium disabled:opacity-70 flex items-center justify-center"
                    onClick={handleReviewSubmit}
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <svg
                          className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          ></circle>
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          ></path>
                        </svg>
                        Submitting...
                      </>
                    ) : (
                      <>
                        Submit Review
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth={1.5}
                          stroke="currentColor"
                          className="w-5 h-5 ml-2"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5"
                          />
                        </svg>
                      </>
                    )}
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="glass shadow-lg rounded-lg mt-6 p-6 w-full text-center">
              <p className="text-gray-600">
                Follow this user to see their posts and leave a review.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Follow;
