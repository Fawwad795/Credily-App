import { useState, useEffect, useRef } from "react";
import {
  FaRegComment,
  FaHeart,
  FaRegHeart,
  FaShare,
  FaCheck,
  FaEdit,
  FaTimes,
  FaEllipsisV,
  FaTrash
} from "react-icons/fa";
import { Link } from "react-router-dom";
import axios from "axios";
import socketClient from "../utils/socket.js";
import { useTheme } from "../components/Nav";

export default function PostCard({
  authorId,
  authorName,
  authorImage,
  postImage,
  postCaption,
  comments: initialComments = [],
  postDate,
  postId,
  likesCount = 0,
  userId,
  isLiked = false,
  onDelete, // callback to remove post from parent UI
}) {
  const { darkMode } = useTheme();
  const [liked, setLiked] = useState(isLiked);
  const [likeCount, setLikeCount] = useState(likesCount);
  const [commentsVisible, setCommentsVisible] = useState(false);
  const [comments, setComments] = useState(initialComments);
  const [newComment, setNewComment] = useState("");
  const [postImgSrc, setPostImgSrc] = useState(postImage);
  const [authorImgSrc, setAuthorImgSrc] = useState(authorImage);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [commentSuccess, setCommentSuccess] = useState(false);
  const [caption, setCaption] = useState(postCaption);
  const [isEditing, setIsEditing] = useState(false);
  const [editCaption, setEditCaption] = useState(postCaption);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Reset success state after 3 seconds
  useEffect(() => {
    let timer;
    if (commentSuccess) {
      timer = setTimeout(() => {
        setCommentSuccess(false);
      }, 3000);
    }
    return () => clearTimeout(timer);
  }, [commentSuccess]);

  // Click outside to close dropdown
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    }
    if (dropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [dropdownOpen]);

  // Polling for comments
  useEffect(() => {
    let interval;
    if (commentsVisible && postId) {
      // Fetch immediately
      fetchComments();
      // Poll every 2 seconds
      interval = setInterval(() => {
        fetchComments();
      }, 2000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [commentsVisible, postId]);

  // Fetch comments function
  const fetchComments = async () => {
    try {
      const response = await axios.get(`/api/posts/${postId}/comments`, {
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      if (response.data && response.data.success) {
        setComments(response.data.comments || []);
      }
    } catch (error) {
      console.error("Error fetching comments:", error);
    }
  };

  const toggleLike = async () => {
    try {
      const response = await axios.post("/api/posts/like", {
        postId,
        userId,
      });

      if (response.data.success) {
        setLiked(response.data.liked);
        setLikeCount(response.data.totalLikes);
      }
    } catch (error) {
      console.error("Error toggling like:", error);
    }
  };

  // --- COMMENT SUBMIT ---
  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    const commentText = newComment.trim();
    if (commentText && !isSubmitting) {
      setIsSubmitting(true);
      setNewComment(""); // Clear input immediately
      try {
        const response = await axios.post("/api/posts/comment", {
          postId,
          userId,
          content: commentText,
        });
        if (response.data.success) {
          // No need to manually add comment, polling will pick it up
          setCommentSuccess(true);
        }
      } catch (error) {
        setNewComment(commentText); // Restore if error
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  // Generate fallback images using placehold.co if the original images fail to load
  const generatePostFallback = () => {
    return `https://placehold.co/600x350/gray/white?text=Post+Image`;
  };

  const generateAuthorFallback = (name) => {
    const initial = name ? name.charAt(0).toUpperCase() : "U";
    return `https://placehold.co/50/gray/white?text=${initial}`;
  };

  // Handle image load errors
  const handlePostImageError = () => {
    setPostImgSrc(generatePostFallback());
  };

  const handleAuthorImageError = () => {
    setAuthorImgSrc(generateAuthorFallback(authorName));
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "";

    return date.toLocaleDateString("en-US", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Format the full name
  const formatFullName = (user) => {
    if (!user) return "Unknown User";

    const firstName = user.firstName || "";
    const lastName = user.lastName || "";

    if (firstName && lastName) {
      return `${firstName} ${lastName}`;
    } else if (firstName) {
      return firstName;
    } else if (user.username) {
      return user.username;
    } else {
      return "Unknown User";
    }
  };

  // --- DELETE POST ---
  const handleDeletePost = async () => {
    if (!window.confirm("Are you sure you want to delete this post?")) return;
    try {
      await axios.post("/api/posts/delete", { postId, userId });
      if (onDelete) onDelete(postId);
    } catch (err) {
      alert("Failed to delete post");
    }
  };

  return (
    <div
      className={`w-full glass rounded-xl overflow-hidden shadow-lg ${
        darkMode ? "bg-gray-800 border-gray-700" : "border-gray-100"
      } relative`}
      data-post-id={postId}
    >
      {/* Author Section */}
      <div className="p-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Link to={authorId ? `/profile/${authorId}` : "#"}>
            <img
              className="w-10 h-10 object-cover rounded-full ring-2 ring-gradient shadow"
              src={authorImgSrc}
              alt={authorName}
              onError={handleAuthorImageError}
            />
          </Link>
          <div>
            <Link
              to={authorId ? `/profile/${authorId}` : "#"}
              className={`font-medium hover:text-purple-600 transition-colors ${
                darkMode ? "text-white" : ""
              }`}
            >
              {authorName}
            </Link>
            <p className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
              {formatDate(postDate) || "Unknown date"}
            </p>
          </div>
        </div>
        {/* Dropdown menu for author */}
        {userId === authorId && (
          <div className="relative" ref={dropdownRef}>
            <button
              className={`${
                darkMode ? "text-gray-400 hover:text-blue-400" : "text-gray-400 hover:text-blue-600"
              } p-2 rounded-full focus:outline-none`}
              onClick={() => setDropdownOpen((open) => !open)}
              title="Post options"
            >
              <FaEllipsisV size={18} />
            </button>
            {dropdownOpen && (
              <div className={`absolute right-0 mt-2 w-36 ${
                darkMode ? "bg-gray-700 border-gray-600" : "bg-white border-gray-200"
              } border rounded shadow-lg z-50`}>
                <button
                  className={`flex items-center w-full px-4 py-2 text-sm ${
                    darkMode ? "hover:bg-gray-600 text-gray-200" : "hover:bg-gray-100 text-left"
                  }`}
                  onClick={() => {
                    setDropdownOpen(false);
                    setIsEditing(true);
                    setEditCaption(caption);
                  }}
                >
                  <FaEdit className="mr-2" /> Edit Post
                </button>
                <button
                  className={`flex items-center w-full px-4 py-2 text-sm text-red-600 ${
                    darkMode ? "hover:bg-gray-600" : "hover:bg-gray-100"
                  } text-left`}
                  onClick={() => {
                    setDropdownOpen(false);
                    handleDeletePost();
                  }}
                >
                  <FaTrash className="mr-2" /> Delete Post
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Post Content - Caption */}
      <div className="px-4 pb-3">
        {isEditing ? (
          <div className="flex items-center gap-2">
            <input
              type="text"
              className={`w-full border ${
                darkMode 
                  ? "border-purple-700 bg-gray-700 text-white" 
                  : "border-purple-300"
              } rounded px-2 py-1 mb-2`}
              value={editCaption}
              onChange={e => setEditCaption(e.target.value)}
              autoFocus
              placeholder="Edit your caption..."
            />
            <button
              className="text-green-600 hover:text-green-800 px-2"
              onClick={async () => {
                try {
                  const response = await axios.put("/api/posts/edit", {
                    postId,
                    userId,
                    caption: editCaption
                  });
                  setCaption(editCaption);
                  setIsEditing(false);
                } catch {
                  alert("Failed to update caption");
                }
              }}
              title="Save"
            >
              <FaCheck />
            </button>
            <button
              className="text-red-600 hover:text-red-800 px-2"
              onClick={() => {
                setIsEditing(false);
                setEditCaption(caption);
              }}
              title="Cancel"
            >
              <FaTimes />
            </button>
          </div>
        ) : (
          <p className={`${darkMode ? "text-gray-200" : "text-gray-800"}`}>{caption}</p>
        )}
      </div>

      {/* Post Image */}
      {postImgSrc && (
        <img
          src={postImgSrc}
          alt="Post content"
          className="w-full object-cover max-h-[500px]"
          onError={handlePostImageError}
        />
      )}

      {/* Engagement Section */}
      <div className="p-4">
        {/* Like & Comment Counts */}
        <div className={`flex justify-between text-sm ${
          darkMode ? "text-gray-400" : "text-gray-600"
        } mb-3`}>
          <div>{likeCount} likes</div>
          <div>{comments.length} comments</div>
        </div>

        {/* Action Buttons */}
        <div className={`flex justify-between border-t border-b ${
          darkMode ? "border-gray-700" : "border-gray-100"
        } py-2`}>
          <button
            onClick={toggleLike}
            className={`flex items-center justify-center space-x-2 px-4 py-2 rounded-full transition-colors ${
              liked 
                ? "text-red-500" 
                : darkMode 
                  ? "text-gray-300 hover:bg-gray-700" 
                  : "text-gray-700 hover:bg-gray-100"
            }`}
          >
            {liked ? <FaHeart className="text-red-500" /> : <FaRegHeart />}
            <span>{liked ? "Liked" : "Like"}</span>
          </button>

          <button
            onClick={() => setCommentsVisible(!commentsVisible)}
            className={`flex items-center justify-center space-x-2 px-4 py-2 rounded-full ${
              darkMode
                ? "text-gray-300 hover:bg-gray-700"
                : "text-gray-700 hover:bg-gray-100"
            } transition-colors`}
          >
            <FaRegComment />
            <span>Comment</span>
          </button>

          <button className={`flex items-center justify-center space-x-2 px-4 py-2 rounded-full ${
            darkMode
              ? "text-gray-300 hover:bg-gray-700"
              : "text-gray-700 hover:bg-gray-100"
          } transition-colors`}>
            <FaShare className="text-sm" />
            <span>Share</span>
          </button>
        </div>

        {/* Comments Section */}
        {commentsVisible && (
          <div className="mt-4">
            <form
              onSubmit={handleCommentSubmit}
              className="flex items-center space-x-2 mb-4"
            >
              <input
                type="text"
                className={`w-full px-4 py-2 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                  darkMode
                    ? "border-gray-600 bg-gray-700 text-white"
                    : "border border-gray-200 text-gray-800"
                }`}
                placeholder="Add a comment..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                disabled={commentSuccess}
              />
              <button
                type="submit"
                className={`${
                  commentSuccess
                    ? "bg-green-500 hover:bg-green-600"
                    : "grad hover:shadow-md"
                } text-white px-4 py-2 rounded-full text-sm font-medium transition duration-300 disabled:opacity-50 min-w-[100px] flex items-center justify-center`}
                disabled={
                  (!newComment.trim() && !commentSuccess) || isSubmitting
                }
              >
                {isSubmitting ? (
                  "Posting..."
                ) : commentSuccess ? (
                  <>
                    <FaCheck className="mr-1" /> Commented
                  </>
                ) : (
                  "Post"
                )}
              </button>
            </form>

            {comments.length > 0 ? (
              <div className="space-y-3 max-h-60 overflow-y-auto">
                {comments.map((comment, index) => (
                  <div
                    key={index}
                    className={`flex items-start space-x-3 ${
                      darkMode ? "bg-gray-700" : "bg-gray-50"
                    } p-3 rounded-lg`}
                  >
                    <Link
                      to={
                        comment.user?._id ? `/profile/${comment.user._id}` : "#"
                      }
                    >
                      <img
                        className="w-8 h-8 object-cover rounded-full ring-1 ring-gray-200"
                        src={
                          comment.user?.profilePicture ||
                          generateAuthorFallback(comment.user?.username)
                        }
                        alt={comment.user?.username || "User"}
                        onError={(e) => {
                          e.target.src = generateAuthorFallback(
                            comment.user?.username
                          );
                        }}
                      />
                    </Link>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <Link
                          to={
                            comment.user?._id
                              ? `/profile/${comment.user._id}`
                              : "#"
                          }
                          className={`font-medium text-sm hover:text-purple-600 transition-colors ${
                            darkMode ? "text-white" : ""
                          }`}
                        >
                          {formatFullName(comment.user)}
                        </Link>
                        <span className={`text-xs ${
                          darkMode ? "text-gray-400" : "text-gray-500"
                        }`}>
                          {formatDate(comment.createdAt)}
                        </span>
                      </div>
                      <p className={`text-sm ${
                        darkMode ? "text-gray-200" : "text-gray-800"
                      } mt-1`}>
                        {comment.content}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className={`text-center ${
                darkMode ? "text-gray-400" : "text-gray-500"
              } text-sm py-4`}>
                No comments yet. Be the first to comment!
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
