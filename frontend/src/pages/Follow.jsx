import React, { useState } from "react";
import Nav from "../components/Nav"; // Adjust the path to your Nav component

const Follow = () => {
  const [isFollowing, setIsFollowing] = useState(false); // State to track follow status
  const [followersCount, setFollowersCount] = useState(315); // Example followers count
  const [followingCount] = useState(120); // Example following count
  const [postsCount] = useState(50); // Example posts count

  const handleFollow = () => {
    if (isFollowing) {
      setFollowersCount(followersCount - 1);
    } else {
      setFollowersCount(followersCount + 1);
    }
    setIsFollowing(!isFollowing);
  };

  return (
    <div className="min-h-screen bg-gray-100 flex">
      {/* Navbar */}
      <Nav />

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center">
        {/* Profile Header */}
        <div className="w-full bg-black text-white py-8 flex flex-col items-center">
          <div className="w-24 h-24 rounded-full bg-gray-300 mb-4"></div>
          <h1 className="text-2xl font-bold">Roshan Jalil</h1>
          <p className="text-gray-400">roshanjalil609@gmail.com</p>
        </div>

        {/* Profile Info */}
        <div className="bg-white shadow-lg rounded-lg mt-4 p-6 w-11/12 max-w-4xl">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-bold">Roshan Jalil</h2>
              <p className="text-gray-600">
                CS @ NUST || Web Developer || Qubit By Qubit Quantum Ambassador
              </p>
              <p className="text-gray-500">📍 Lahore, Punjab, Pakistan</p>
            </div>
            <div className="flex space-x-4">
              <button
                onClick={handleFollow}
                className={`px-6 py-2 rounded-lg font-medium ${
                  isFollowing
                    ? "bg-gray-300 text-gray-700"
                    : "bg-blue-500 text-white hover:bg-blue-600"
                }`}
              >
                {isFollowing ? "Unfollow" : "Follow"}
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
              <p className="text-gray-600">Here are the posts by this user...</p>
              {/* Replace with actual posts */}
              <div className="grid grid-cols-3 gap-4 mt-4">
                <div className="w-full h-32 bg-gray-300 rounded-lg"></div>
                <div className="w-full h-32 bg-gray-300 rounded-lg"></div>
                <div className="w-full h-32 bg-gray-300 rounded-lg"></div>
              </div>
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