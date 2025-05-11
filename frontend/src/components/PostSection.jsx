import React from "react";
import { Camera } from "lucide-react"; // adjust if you use a different icon lib

const PostSection = ({ posts, onCreate }) => {
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
                  src={post.image || "https://via.placeholder.com/300x160"}
                  alt={post.title || `Post ${index + 1}`}
                />
                <div className="p-4">
                  <h5 className="mb-1 text-lg font-bold tracking-tight text-gray-900">
                    {post.title || `Post ${index + 1}`}
                  </h5>
                  <p className="mb-3 text-sm text-gray-700">
                    {post.description || "A short description of this post."}
                  </p>
                  <div className="flex justify-between items-center text-xs text-gray-500">
                    <p>{post.date || "May 10, 2025"}</p>
                    <div className="flex items-center">
                      <span className="mr-3">{post.likes || 0} likes</span>
                      <span>{post.comments || 0} comments</span>
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
