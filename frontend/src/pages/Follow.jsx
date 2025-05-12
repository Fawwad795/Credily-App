import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import Nav from "../components/Nav"; // Adjust the path to your Nav component

const Follow = () => {
  const { id } = useParams();
  const [profile, setProfile] = useState(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [postsCount, setPostsCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isPending, setIsPending] = useState(false);

  useEffect(() => {
    fetchProfile();
    checkConnectionStatus();
    refreshNotifications();
  }, [id]);

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/users/profile/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      
      if (data.success) {
        setProfile(data.data);
        setFollowersCount(data.data.followersCount || 0);
        setFollowingCount(data.data.followingCount || 0);
        setPostsCount(data.data.postsCount || 0);
      } else {
        setError(data.message);
      }
    } catch (error) {
      setError('Failed to fetch profile');
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkConnectionStatus = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('No authentication token found');
        return;
      }

      console.log('Checking connection status for:', id);
      const response = await fetch(`/api/users/connections/status/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      console.log('Connection status response:', data);
      
      if (data.success) {
        setIsFollowing(data.data.status === 'accepted');
        setIsPending(data.data.status === 'pending');
      }
    } catch (error) {
      console.error('Error checking connection status:', error);
    }
  };

  const handleFollow = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('No authentication token found');
        return;
      }

      console.log('Sending connection request to:', id);
      const response = await fetch('/api/users/connections', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          recipientId: id,
          type: 'connection_request'
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to send connection request');
      }

      const data = await response.json();
      console.log('Connection request response:', data);
      
      if (data.success) {
        setIsFollowing(false);
        setIsPending(true);

        try {
          const notificationResponse = await fetch('/api/notifications', {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });
          const notificationData = await notificationResponse.json();
          console.log('Notifications after connection request:', notificationData);
        } catch (error) {
          console.error('Error refreshing notifications:', error);
        }
      } else {
        console.error('Failed to send connection request:', data.message);
      }
    } catch (error) {
      console.error('Error sending connection request:', error);
      alert(error.message || 'Failed to send connection request');
    }
  };

  const handleUnfollow = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/users/connections/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      
      if (data.success) {
        setIsFollowing(false);
        setFollowersCount(prev => prev - 1);
      }
    } catch (error) {
      console.error('Error unfollowing user:', error);
    }
  };

  const getFollowButtonText = () => {
    if (isFollowing) {
      return "Unfollow";
    }
    if (isPending) {
      return "Request Sent";
    }
    return "Follow";
  };

  const getFollowButtonStyle = () => {
    if (isFollowing) {
      return "bg-gray-300 text-gray-700 hover:bg-gray-400";
    }
    if (isPending) {
      return "bg-yellow-500 text-white cursor-not-allowed";
    }
    return "bg-blue-500 text-white hover:bg-blue-600";
  };

  const handleButtonClick = () => {
    if (isPending) {
      return;
    }
    if (isFollowing) {
      handleUnfollow();
    } else {
      handleFollow();
    }
  };

  const refreshNotifications = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch('/api/notifications', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await response.json();
      console.log('Refreshed notifications:', data);
    } catch (error) {
      console.error('Error refreshing notifications:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex">
        <Nav />
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 flex">
        <Nav />
        <div className="flex-1 flex items-center justify-center">
          <p className="text-red-500">{error}</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-100 flex">
        <Nav />
        <div className="flex-1 flex items-center justify-center">
          <p className="text-gray-500">Profile not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex">
      {/* Navbar */}
      <Nav />

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center">
        {/* Profile Header */}
        <div className="w-full bg-black text-white py-8 flex flex-col items-center">
          <img
            src={profile.profilePicture || '/default-avatar.png'}
            alt="Profile"
            className="w-24 h-24 rounded-full object-cover mb-4"
          />
          <h1 className="text-2xl font-bold">{profile.username}</h1>
          <p className="text-gray-400">{profile.email}</p>
        </div>

        {/* Profile Info */}
        <div className="bg-white shadow-lg rounded-lg mt-4 p-6 w-11/12 max-w-4xl">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-bold">{profile.username}</h2>
              <p className="text-gray-600">{profile.bio || 'No bio yet'}</p>
              <p className="text-gray-500">{profile.location || 'No location set'}</p>
            </div>
            <div className="flex space-x-4">
              <button
                onClick={handleButtonClick}
                className={`px-6 py-2 rounded-lg font-medium ${getFollowButtonStyle()}`}
                disabled={isPending}
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

        {/* Conditional Sections */}
        {isFollowing ? (
          <>
            {/* Posts Section */}
            <div className="bg-white shadow-lg rounded-lg mt-4 p-6 w-11/12 max-w-4xl">
              <h3 className="text-lg font-bold mb-4">Posts</h3>
              {profile.posts && profile.posts.length > 0 ? (
                <div className="grid grid-cols-3 gap-4 mt-4">
                  {profile.posts.map((post) => (
                    <div key={post._id} className="w-full h-32 bg-gray-300 rounded-lg">
                      {/* Add post content here */}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-600">No posts yet</p>
              )}
            </div>

            {/* Leave a Review Section */}
            <div className="bg-white shadow-lg rounded-lg mt-4 p-6 w-11/12 max-w-4xl">
              <h3 className="text-lg font-bold mb-4">Leave a Review</h3>
              <textarea
                rows="4"
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-400"
                placeholder="Write your review here..."
              ></textarea>
              <button className="mt-4 bg-teal-500 text-white py-2 px-4 rounded-lg hover:bg-teal-600 transition duration-300">
                Submit Review
              </button>
            </div>
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