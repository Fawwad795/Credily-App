import { useState } from "react";
import { FaRegComment, FaHeart, FaRegHeart, FaShare } from "react-icons/fa";
import { Link } from "react-router-dom";

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
}) {
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(likesCount);
  const [commentsVisible, setCommentsVisible] = useState(false);
  const [comments, setComments] = useState(initialComments);
  const [newComment, setNewComment] = useState("");
  const [postImgSrc, setPostImgSrc] = useState(postImage);
  const [authorImgSrc, setAuthorImgSrc] = useState(authorImage);

  const toggleLike = () => {
    setLiked(!liked);
    setLikeCount((prev) => (liked ? prev - 1 : prev + 1));
    // Here you would make an API call to like/unlike the post
  };

  const handleCommentSubmit = (e) => {
    e.preventDefault();
    if (newComment.trim()) {
      setComments([...comments, newComment]);
      setNewComment("");
      // Here you would make an API call to add the comment
    }
  };

  // Generate fallback images using placehold.co if the original images fail to load
  const generatePostFallback = () => {
    return `https://placehold.co/600x350/gray/white?text=Post+Image`;
  };

  const generateAuthorFallback = () => {
    const initial = authorName ? authorName.charAt(0).toUpperCase() : "U";
    return `https://placehold.co/50/gray/white?text=${initial}`;
  };

  // Handle image load errors
  const handlePostImageError = () => {
    setPostImgSrc(generatePostFallback());
  };

  const handleAuthorImageError = () => {
    setAuthorImgSrc(generateAuthorFallback());
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
    });
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
      <img
        src={postImgSrc}
        alt="Post content"
        className="w-full object-cover max-h-[500px]"
        onError={handlePostImageError}
      />

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
              />
              <button
                type="submit"
                className="grad text-white px-4 py-2 rounded-full text-sm font-medium transition duration-300 hover:shadow-md disabled:opacity-50"
                disabled={!newComment.trim()}
              >
                Post
              </button>
            </form>

            {comments.length > 0 ? (
              <div className="space-y-3 max-h-60 overflow-y-auto">
                {comments.map((comment, index) => (
                  <div
                    key={index}
                    className="text-sm bg-gray-50 p-3 rounded-lg"
                  >
                    <p className="text-gray-800">{comment}</p>
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
