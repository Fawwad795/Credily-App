import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Nav from "../components/Nav";
import PostCard from "../components/PostCard";
import SuggestedUsers from "../components/SuggestedUsers";
import api from "../utils/axios";
import { FaPlus, FaUserFriends } from "react-icons/fa";

const Home = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchConnectedUserPosts = async () => {
      try {
        setLoading(true);
        // Get the current user's ID from the token
        const token = localStorage.getItem("token");
        if (!token) {
          setError("You must be logged in to view posts");
          setLoading(false);
          return;
        }

        const parseJwt = (token) => {
          try {
            return JSON.parse(atob(token.split(".")[1]));
          } catch {
            return null;
          }
        };

        const decodedToken = parseJwt(token);
        if (!decodedToken || !decodedToken.id) {
          setError("Invalid authentication token");
          setLoading(false);
          return;
        }

        const userId = decodedToken.id;

        // Use the loadHome endpoint to get posts from connected users
        const response = await api.post("/posts/loadhome", { userId });
        const postsData = response.data.data || [];

        setPosts(postsData);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching posts:", error);
        setError("Failed to load posts");
        setLoading(false);
      }
    };

    fetchConnectedUserPosts();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation on the side */}
      <Nav />

      {/* Main Content - adjusted to not overlap with Nav */}
      <div className="sm:ml-64 min-h-screen">
        <div className="max-w-6xl mx-auto px-4 pt-6">
          <div className="flex flex-col md:flex-row md:gap-6">
            {/* Center Feed - wider on mobile, adjusted on desktop */}
            <div className="w-full md:w-8/12">
              {/* Header & Create Post Button */}
              <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-red-600 pl-16 sm:pl-0">
                  Your Feed
                </h1>
                <button className="grad text-white px-4 py-2 rounded-full flex items-center space-x-2 shadow-lg hover:shadow-xl transition duration-300 transform hover:scale-105">
                  <FaPlus className="text-sm" />
                  <span>Create Post</span>
                </button>
              </div>

              {/* Posts */}
              <div className="space-y-6 pb-10 hide-scrollbar">
                {loading ? (
                  <div className="flex justify-center items-center h-60 glass rounded-lg">
                    <div className="animate-pulse flex flex-col items-center">
                      <div className="w-16 h-16 rounded-full bg-gradient-to-r from-purple-400 to-red-400 animate-spin mb-4"></div>
                      <p className="text-gray-600">Loading your feed...</p>
                    </div>
                  </div>
                ) : error ? (
                  <div className="glass p-6 rounded-lg text-red-500 text-center">
                    <p className="font-medium">{error}</p>
                    <button
                      onClick={() => window.location.reload()}
                      className="mt-4 px-4 py-2 grad text-white rounded-full text-sm"
                    >
                      Try Again
                    </button>
                  </div>
                ) : posts.length > 0 ? (
                  posts.map((post, index) => (
                    <div
                      key={post._id || index}
                      className="transform transition duration-300 hover:scale-[1.01]"
                    >
                      <PostCard
                        authorId={post.author?._id}
                        authorName={post.author?.username || "Anonymous"}
                        authorImage={
                          post.author?.profilePicture ||
                          `https://placehold.co/50/gray/white?text=${
                            post.author?.username?.charAt(0) || "A"
                          }`
                        }
                        postImage={
                          post.media && post.media.length > 0
                            ? post.media[0].url
                            : "https://placehold.co/600x350/gray/white?text=No+Image"
                        }
                        postCaption={post.caption}
                        comments={
                          post.comments
                            ? post.comments.map((comment) => comment.content)
                            : []
                        }
                        postDate={post.createdAt}
                        postId={post._id}
                        likesCount={post.totalLikes || 0}
                      />
                    </div>
                  ))
                ) : (
                  <div className="glass p-8 rounded-lg text-center">
                    <div className="w-20 h-20 rounded-full bg-gradient-to-r from-purple-200 to-red-200 mx-auto flex items-center justify-center mb-4">
                      <FaUserFriends className="text-2xl text-gray-600" />
                    </div>
                    <h3 className="text-xl font-medium text-gray-800 mb-2">
                      Your feed is empty
                    </h3>
                    <p className="text-gray-600 mb-6">
                      Connect with other users to see their posts here!
                    </p>
                    <Link
                      to="/search"
                      className="grad text-white px-6 py-2 rounded-full inline-block shadow-md hover:shadow-lg transition duration-300"
                    >
                      Find People
                    </Link>
                  </div>
                )}
              </div>
            </div>

            {/* Right Sidebar - People You May Know */}
            <div className="w-full md:w-4/12 mt-6 md:mt-0">
              <div className="sticky top-6">
                <SuggestedUsers />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Custom style for hiding scrollbar */}
      <style jsx="true">{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .grad-text {
          background: linear-gradient(to right, #dc2430, #7b4397);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
      `}</style>
    </div>
  );
};

export default Home;
