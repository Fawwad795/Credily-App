import React from "react";
import { Camera } from "lucide-react"; // adjust if you use a different icon lib

const PostSection = ({ posts, onCreate }) => {
  // Function to format date for display
  const formatDate = (dateString) => {
    if (!dateString) return "May 10, 2025";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Function to get image URL from post
  const getPostImage = (post) => {
    if (!post) return "https://via.placeholder.com/300x160";

    // If this is our database post format
    if (post.media && post.media.length > 0 && post.media[0].url) {
      return post.media[0].url;
    }

    // If this is the sample post format
    if (post.image) {
      return post.image;
    }

    return "https://via.placeholder.com/300x160";
  };

  // Function to get post title
  const getPostTitle = (post, index) => {
    if (post.title) return post.title;
    if (post.caption) {
      // Use first 20 chars of caption as title
      return post.caption.length > 20
        ? post.caption.substring(0, 20) + "..."
        : post.caption;
    }
    return `Post ${index + 1}`;
  };

  // Function to get post description
  const getPostDescription = (post) => {
    if (post.description) return post.description;
    if (post.caption) return post.caption;
    return "A short description of this post.";
  };

  return (
    <div className="max-w-4xl mx-auto my-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-gray-800">Posts</h2>
        <button
          onClick={onCreate}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium flex items-center"
        >
          <Camera size={16} className="mr-2" />
          Create New
        </button>
      </div>

      {/* Horizontal Scrolling Container */}
      <div className="relative">
        <div className="overflow-x-auto pb-4 hide-scrollbar">
          <div className="flex space-x-4 px-1">
            {posts.map((post, index) => (
              <div
                key={index}
                className="flex-shrink-0 w-72 bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden"
              >
                <img
                  className="w-full h-40 object-cover"
                  src={getPostImage(post)}
                  alt={getPostTitle(post, index)}
                />
                <div className="p-4">
                  <h5 className="mb-1 text-lg font-bold tracking-tight text-gray-900">
                    {getPostTitle(post, index)}
                  </h5>
                  <p className="mb-3 text-sm text-gray-700">
                    {getPostDescription(post)}
                  </p>
                  <div className="flex justify-between items-center text-xs text-gray-500">
                    <p>{formatDate(post.createdAt || post.date)}</p>
                    <div className="flex items-center">
                      <span className="mr-3">
                        {post.totalLikes || post.likes || 0} likes
                      </span>
                      <span>
                        {post.totalComments || post.comments || 0} comments
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Gradient Indicator */}
        <div className="absolute top-0 right-0 bottom-0 w-16 bg-gradient-to-l from-gray-100 to-transparent pointer-events-none"></div>
      </div>

      {/* Custom style for hiding scrollbar */}
      <style jsx>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
};

export default PostSection;
