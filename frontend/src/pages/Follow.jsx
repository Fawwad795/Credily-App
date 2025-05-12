import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import Nav from "../components/Nav"; // Adjust the path to your Nav component

const Follow = () => {
  const { id } = useParams(); // Get the user ID from URL params
  const [isFollowing, setIsFollowing] = useState(false); // State to track follow status
  const [isPendingRequest, setIsPendingRequest] = useState(false); // State to track pending follow requests
  const [pendingRequestId, setPendingRequestId] = useState(null); // Store pending request ID for cancellation
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [postsCount, setPostsCount] = useState(0);
  const [reviewContent, setReviewContent] = useState("");
  const [rating, setRating] = useState(5);
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
    profilePicture: "",
    bio: "",
    location: "",
    phoneNumber: "",
  });

  useEffect(() => {
    // Fetch user data when component mounts
    if (id) {
      fetchUserData();
      checkConnectionStatus();
      fetchConnectionsCount();
      checkPendingRequest();
    }
  }, [id]);

  const fetchUserData = async () => {
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
          profilePicture: profile.profilePicture || "",
          bio: profile.bio || "No bio available",
          location: profile.location || "Location not specified",
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
  };

  // Check if the current user is connected to this profile
  const checkConnectionStatus = async () => {
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
  };

  // Check if there's a pending follow request
  const checkPendingRequest = async () => {
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
  };

  // Fetch connection counts
  const fetchConnectionsCount = async () => {
    try {
      // Get total connections count using the available endpoint
      const response = await fetch(`/api/users/${id}/connections`);

      if (response.ok) {
        const data = await response.json();
        // Use the totalConnections as our followers count for now
        if (data.success && data.data) {
          setFollowersCount(data.data.totalConnections || 0);
        }
      }

      // For now, set some dummy values for following and posts
      // In a real app, you'd have endpoints for these counts
      setFollowingCount(120);
      setPostsCount(50);
    } catch (error) {
      console.error("Error fetching connection counts:", error);
      // Fallback values
      setFollowersCount(0);
      setFollowingCount(0);
      setPostsCount(0);
    }
  };

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
          rating: rating,
          categories: ["trustworthiness", "communication"],
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

  return (
    <div className="min-h-screen bg-gray-100 flex">
      {/* Navbar */}
      <Nav />

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center">
        {/* Profile Header */}
        <div className="w-full bg-black text-white py-8 flex flex-col items-center">
          <div className="w-24 h-24 rounded-full bg-gray-300 mb-4">
            {userData.profilePicture && (
              <img
                src={userData.profilePicture}
                alt={userData.username}
                className="w-full h-full rounded-full object-cover"
              />
            )}
          </div>
          <h1 className="text-2xl font-bold">{userData.username || "User"}</h1>
          <p className="text-gray-400">
            {userData.email || "email@example.com"}
          </p>
        </div>

        {/* Profile Info */}
        <div className="bg-white shadow-lg rounded-lg mt-4 p-6 w-11/12 max-w-4xl">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-bold">
                {userData.username || "User"}
              </h2>
              <p className="text-gray-600">
                {userData.bio || "No bio available"}
              </p>
              <p className="text-gray-500">
                📍 {userData.location || "Location not specified"}
              </p>
            </div>
            <div className="flex space-x-4">
              <button
                onClick={handleFollow}
                className={`px-6 py-2 rounded-lg font-medium ${getFollowButtonClass()}`}
              >
                {getFollowButtonText()}
              </button>
              <button className="px-6 py-2 rounded-lg bg-green-500 text-white hover:bg-green-600 font-medium">
                Message
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="flex justify-around mt-6">
            <div className="text-center">
              <h3 className="text-xl font-bold">{followersCount}</h3>
              <p className="text-gray-600">Followers</p>
            </div>
            <div className="text-center">
              <h3 className="text-xl font-bold">{followingCount}</h3>
              <p className="text-gray-600">Following</p>
            </div>
            <div className="text-center">
              <h3 className="text-xl font-bold">{postsCount}</h3>
              <p className="text-gray-600">Posts</p>
            </div>
          </div>
        </div>

        {/* Conditional Sections based on Follow Status */}
        {isFollowing ? (
          <>
            {/* Posts Section - Only show when following */}
            <div className="bg-white shadow-lg rounded-lg mt-4 p-6 w-11/12 max-w-4xl">
              <h3 className="text-lg font-bold mb-4">Posts</h3>
              <p className="text-gray-600">
                Here are the posts by this user...
              </p>
              {/* Replace with actual posts */}
              <div className="grid grid-cols-3 gap-4 mt-4">
                <div className="w-full h-32 bg-gray-300 rounded-lg"></div>
                <div className="w-full h-32 bg-gray-300 rounded-lg"></div>
                <div className="w-full h-32 bg-gray-300 rounded-lg"></div>
              </div>
            </div>

            {/* Leave a Review Section - Only show when following or have mutual connections */}
            {canWriteReview() && (
              <div className="bg-white shadow-lg rounded-lg mt-4 p-6 w-11/12 max-w-4xl">
                <h3 className="text-lg font-bold mb-4">Leave a Review</h3>

                {connectionStatus.hasDirectConnection && (
                  <div className="p-3 mb-4 bg-blue-100 rounded">
                    <p>You are directly connected with this user.</p>
                  </div>
                )}

                {connectionStatus.hasMutualConnections && (
                  <div className="p-3 mb-4 bg-green-100 rounded">
                    <p>
                      You have {connectionStatus.mutualConnectionsCount} mutual
                      connection(s) with this user.
                    </p>
                  </div>
                )}

                {/* Rating Selection */}
                <div className="mb-4">
                  <label className="block text-gray-700 mb-2">Rating:</label>
                  <div className="flex space-x-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        onClick={() => setRating(star)}
                        className={`text-2xl ${
                          rating >= star ? "text-yellow-500" : "text-gray-300"
                        }`}
                      >
                        ★
                      </button>
                    ))}
                  </div>
                </div>

                {/* Review Text Area */}
                <textarea
                  rows="4"
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-400"
                  placeholder="Write your review here..."
                  value={reviewContent}
                  onChange={(e) => setReviewContent(e.target.value)}
                ></textarea>

                {/* Error Message */}
                {reviewError && (
                  <p className="text-red-500 mt-2">{reviewError}</p>
                )}

                {/* Success Message */}
                {reviewSuccess && (
                  <p className="text-green-500 mt-2">{reviewSuccess}</p>
                )}

                <button
                  className="mt-4 bg-teal-500 text-white py-2 px-4 rounded-lg hover:bg-teal-600 transition duration-300 disabled:bg-gray-400"
                  onClick={handleReviewSubmit}
                  disabled={loading}
                >
                  {loading ? "Submitting..." : "Submit Review"}
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="bg-white shadow-lg rounded-lg mt-4 p-6 w-11/12 max-w-4xl">
            <p className="text-gray-600 text-center">
              Follow this user to see their posts and leave a review.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Follow;
