import React, { useState } from "react";
import { Camera, Trash2, X } from "lucide-react"; // Added X icon for close button

const PostSection = ({ posts, onCreate, onDelete }) => {
  const [confirmDialog, setConfirmDialog] = useState({ show: false, postId: null });
  
  // Function to format date for display
  const formatDate = (dateString) => {
    if (!dateString) return "May 10, 2025";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Function to generate a simple post image
  const generatePostImage = (index) => {
    const colors = ["#4F46E5", "#0EA5E9", "#10B981", "#F59E0B", "#EF4444"];
    const color = colors[index % colors.length];
    const text = `Post ${index + 1}`;
    return `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='160' viewBox='0 0 300 160'%3E%3Crect width='300' height='160' fill='${color.replace(
      "#",
      "%23"
    )}'/%3E%3Ctext x='150' y='80' font-family='Arial' font-size='24' fill='white' text-anchor='middle'%3E${text}%3C/text%3E%3C/svg%3E`;
  };

  // Function to get image URL from post
  const getPostImage = (post, index) => {
    if (!post) return generatePostImage(index);

    // If this is our database post format
    if (post.media && post.media.length > 0 && post.media[0].url) {
      return post.media[0].url;
    }

    // If this is the sample post format
    if (post.image) {
      return post.image;
    }

    return generatePostImage(index);
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

  // Function to handle post deletion
  const handleDelete = (postId) => {
    if (onDelete && typeof onDelete === 'function') {
      console.log("Attempting to delete post with ID:", postId);
      setConfirmDialog({ show: true, postId });
    }
  };

  // Function to confirm post deletion
  const confirmDelete = () => {
    if (confirmDialog.postId && onDelete) {
      console.log("Confirming delete for post ID:", confirmDialog.postId);
      onDelete(confirmDialog.postId);
      setConfirmDialog({ show: false, postId: null });
    }
  };

  // Function to cancel post deletion
  const cancelDelete = () => {
    setConfirmDialog({ show: false, postId: null });
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
                <div className="relative">
                  <img
                    className="w-full h-40 object-cover"
                    src={getPostImage(post, index)}
                    alt={getPostTitle(post, index)}
                  />
                  
                  {/* Delete Button - only show if onDelete is provided */}
                  {onDelete && typeof onDelete === 'function' && (
                    <button
                      onClick={() => handleDelete(post._id)}
                      className="absolute top-2 right-2 bg-white bg-opacity-80 p-1.5 rounded-full shadow-md hover:bg-red-100 transition-colors"
                      title="Delete post"
                    >
                      <Trash2 size={16} className="text-red-600" />
                    </button>
                  )}
                </div>
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

      {/* Confirmation Dialog */}
      {confirmDialog.show && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">Confirm Deletion</h3>
              <button 
                onClick={cancelDelete}
                className="text-gray-400 hover:text-gray-500"
              >
                <X size={20} />
              </button>
            </div>
            <p className="mb-6 text-gray-600">Are you sure you want to delete this post? This action cannot be undone.</p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={cancelDelete}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 bg-red-600 rounded-md text-white hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom style for hiding scrollbar */}
      <style jsx="true">{`
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
