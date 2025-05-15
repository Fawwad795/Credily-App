import { useState, useEffect } from "react";
import {
  FaRegComment,
  FaHeart,
  FaRegHeart,
  FaShare,
  FaCheck,
} from "react-icons/fa";
import { Link } from "react-router-dom";
import axios from "axios";

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
}) {
  const [liked, setLiked] = useState(isLiked);
  const [likeCount, setLikeCount] = useState(likesCount);
  const [commentsVisible, setCommentsVisible] = useState(false);
  const [comments, setComments] = useState(initialComments);
  const [newComment, setNewComment] = useState("");
  const [postImgSrc, setPostImgSrc] = useState(postImage);
  const [authorImgSrc, setAuthorImgSrc] = useState(authorImage);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [commentSuccess, setCommentSuccess] = useState(false);

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

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (newComment.trim() && !isSubmitting) {
      setIsSubmitting(true);

      try {
        const response = await axios.post("/api/posts/comment", {
          postId,
          userId,
          content: newComment.trim(),
        });

        if (response.data.success) {
          setComments([...comments, response.data.comment]);
          setNewComment("");
          setCommentSuccess(true);
          // Open comments section if not already open
          if (!commentsVisible) {
            setCommentsVisible(true);
          }
        }
      } catch (error) {
        console.error("Error posting comment:", error);
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

  return (
    <div
      className="w-full glass rounded-xl overflow-hidden shadow-lg border border-gray-100"
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
              className="font-medium hover:text-purple-600 transition-colors"
            >
              {authorName}
            </Link>
            <p className="text-xs text-gray-500">
              {formatDate(postDate) || "Unknown date"}
            </p>
          </div>
        </div>
        <div className="text-gray-400 cursor-pointer hover:text-gray-600">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
          </svg>
        </div>
      </div>

      {/* Post Content - Caption */}
      <div className="px-4 pb-3">
        <p className="text-gray-800">{postCaption}</p>
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
        <div className="flex justify-between text-sm text-gray-600 mb-3">
          <div>{likeCount} likes</div>
          <div>{comments.length} comments</div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-between border-t border-b border-gray-100 py-2">
          <button
            onClick={toggleLike}
            className={`flex items-center justify-center space-x-2 px-4 py-2 rounded-full transition-colors ${
              liked ? "text-red-500" : "text-gray-700 hover:bg-gray-100"
            }`}
          >
            {liked ? <FaHeart className="text-red-500" /> : <FaRegHeart />}
            <span>{liked ? "Liked" : "Like"}</span>
          </button>

          <button
            onClick={() => setCommentsVisible(!commentsVisible)}
            className="flex items-center justify-center space-x-2 px-4 py-2 rounded-full text-gray-700 hover:bg-gray-100 transition-colors"
          >
            <FaRegComment />
            <span>Comment</span>
          </button>

          <button className="flex items-center justify-center space-x-2 px-4 py-2 rounded-full text-gray-700 hover:bg-gray-100 transition-colors">
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
                className="w-full border border-gray-200 px-4 py-2 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
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
                    className="flex items-start space-x-3 bg-gray-50 p-3 rounded-lg"
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
                          className="font-medium text-sm hover:text-purple-600 transition-colors"
                        >
                          {formatFullName(comment.user)}
                        </Link>
                        <span className="text-xs text-gray-500">
                          {formatDate(comment.createdAt)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-800 mt-1">
                        {comment.content}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-gray-500 text-sm py-4">
                No comments yet. Be the first to comment!
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
