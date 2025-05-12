import { useState } from "react";
import { FaRegComment, FaHeart, FaRegHeart } from "react-icons/fa";

export default function PostCard({
  authorName,
  authorImage,
  postImage,
  postCaption,
  comments: initialComments = [],
}) {
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [commentsVisible, setCommentsVisible] = useState(false);
  const [comments, setComments] = useState(initialComments);
  const [newComment, setNewComment] = useState("");

  const toggleLike = () => {
    setLiked(!liked);
    setLikeCount((prev) => (liked ? prev - 1 : prev + 1));
  };

  const handleCommentSubmit = (e) => {
    e.preventDefault();
    if (newComment.trim()) {
      setComments([...comments, newComment]);
      setNewComment("");
    }
  };

  return (
    <div className="mx-auto px-4 max-w-xl my-15">
      <div className="bg-white shadow-2xl rounded-lg tracking-wide">
        <img
          src={postImage}
          alt="Post"
          className="w-full h-64 object-cover rounded-t-lg"
        />

        <div className="px-4 py-2">
          <h2 className="font-bold text-2xl text-gray-800">
            My Amazing Journey to the Mountains
          </h2>
          <p className="text-sm text-gray-700 mt-2">{postCaption}</p>

          {/* Author Section */}
          <div className="author flex items-center mt-5">
            <img
              className="w-12 h-12 object-cover rounded-full shadow mr-4"
              src={authorImage}
              alt="Author"
            />
            <div>
              <p className="text-sm text-gray-900 font-semibold">{authorName}</p>
              <span className="text-xs text-gray-600">21 SEP 2015</span>
            </div>
          </div>

          {/* Comments Section */}
          <div className="mt-4">
            <button
              onClick={() => setCommentsVisible(!commentsVisible)}
              className="text-blue-500 text-xs"
            >
              {commentsVisible ? "Hide Comments" : "Show Comments"}
            </button>

            {commentsVisible && (
              <div className="mt-4 border-t pt-2">
                <form onSubmit={handleCommentSubmit} className="flex items-center space-x-2">
                  <input
                    type="text"
                    className="w-full border px-3 py-1 rounded text-sm focus:outline-none"
                    placeholder="Add a comment..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                  />
                  <button type="submit" className="text-blue-500 text-sm font-medium">
                    Post
                  </button>
                </form>
                <ul className="mt-3 space-y-2">
                  {comments.map((comment, index) => (
                    <li key={index} className="text-gray-700 text-sm">
                      {comment}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* Footer Section */}
        <div className="flex items-center justify-between px-4 py-4">
          {/* Like Button */}
          <button onClick={toggleLike} className="flex items-center text-gray-700">
            {liked ? (
              <FaHeart className="text-red-500 w-5 h-5 mr-1" />
            ) : (
              <FaRegHeart className="text-blue-500 w-5 h-5 mr-1" />
            )}
            {likeCount}
          </button>

          {/* Comments Button */}
          <button
            onClick={() => setCommentsVisible(!commentsVisible)}
            className="flex items-center text-gray-700"
          >
            <FaRegComment className="w-5 h-5 mr-1" />
            {comments.length}
          </button>
        </div>
      </div>
    </div>
  );
}
