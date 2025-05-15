import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Nav from "../components/Nav";
import PostCard from "../components/PostCard";
import SuggestedUsers from "../components/SuggestedUsers";
import api from "../utils/axios";
import { FaPlus, FaUserFriends } from "react-icons/fa";
import { X, Upload } from "lucide-react";

// Function to generate placeholder image URL for new posts
const getDefaultPostImage = () => {
  return "https://placehold.co/600x350/red/white?text=New+Post";
};

// Helper function to parse JWT token
const parseJwt = (token) => {
  try {
    return JSON.parse(atob(token.split(".")[1]));
  } catch (error) {
    console.error("Error parsing JWT:", error);
    return null;
  }
};

const Home = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newPost, setNewPost] = useState({
    image: null,
    imageFile: null,
    caption: "",
  });
  const [statusPopup, setStatusPopup] = useState({ show: false, message: "", type: "" });

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

  useEffect(() => {
    fetchConnectedUserPosts();
  }, []);

  const handleImageChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setNewPost({
        ...newPost,
        imageFile: file,
        image: URL.createObjectURL(file),
      });
    }
  };

  const handleCaptionChange = (e) => {
    setNewPost({
      ...newPost,
      caption: e.target.value,
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);

    try {
      // Get token and verify it's valid
      const token = localStorage.getItem("token");
      if (!token) {
        setStatusPopup({ show: true, message: "No authentication token found", type: "error" });
        setLoading(false);
        return;
      }

      const decodedToken = parseJwt(token);
      if (!decodedToken || !decodedToken.id) {
        setStatusPopup({ show: true, message: "Invalid authentication token", type: "error" });
        setLoading(false);
        return;
      }

      const userId = decodedToken.id;
      let imageUrl;

      // First, upload the image if we have one
      if (newPost.imageFile) {
        const formData = new FormData();
        formData.append("image", newPost.imageFile);

        // Upload image using FormData
        try {
          const uploadResponse = await api.post("/uploads/image", formData, {
            headers: {
              "Content-Type": "multipart/form-data"
            }
          });
          
          if (uploadResponse.data.success) {
            imageUrl = uploadResponse.data.imageUrl;
          } else {
            throw new Error(uploadResponse.data.message || "Failed to upload image");
          }
        } catch (uploadError) {
          console.error("Image upload error:", uploadError);
          setStatusPopup({ 
            show: true, 
            message: uploadError.response?.data?.message || "Failed to upload image. Please try again.", 
            type: "error" 
          });
          setLoading(false);
          return;
        }
      } else {
        imageUrl = getDefaultPostImage();
      }

      // Create post data with the image URL
      const postData = {
        caption: newPost.caption,
        author: userId,
        media: [
          {
            type: "image",
            url: imageUrl,
            altText: "",
          },
        ],
        visibility: "public",
      };

      // Send post data to backend using API instance
      const response = await api.post("/posts", postData);

      if (response.data.success) {
        console.log("Post created successfully:", response.data);
        
        // Show success message
        setStatusPopup({ show: true, message: "Post created successfully!", type: "success" });
        
        // Close popup after 3 seconds
        setTimeout(() => {
          setStatusPopup({ show: false, message: "", type: "" });
        }, 3000);
        
        // Update posts list
        fetchConnectedUserPosts();
        
        // Reset form and close modal
        setIsModalOpen(false);
        setNewPost({ image: null, imageFile: null, caption: "" });
      } else {
        throw new Error(response.data.message || "Failed to create post");
      }
    } catch (error) {
      console.error("Error creating post:", error);
      setStatusPopup({ 
        show: true, 
        message: error.response?.data?.message || "Error creating post. Please try again.", 
        type: "error" 
      });
    } finally {
      setLoading(false);
    }
  };

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
                <button 
                  className="grad text-white px-4 py-2 rounded-full flex items-center space-x-2 shadow-lg hover:shadow-xl transition duration-300 transform hover:scale-105"
                  onClick={() => setIsModalOpen(true)}
                >
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

      {/* Create New Post Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-gradient-to-b from-white/60 to-gray-400/40 backdrop-filter backdrop-blur-[4px] flex items-center justify-center z-50">
          <div className="bg-white/95 rounded-lg shadow-xl w-full max-w-md p-6 relative">
            {/* Close button */}
            <button
              onClick={() => {
                setIsModalOpen(false);
                setNewPost({ image: null, imageFile: null, caption: "" });
              }}
              className="absolute top-3 right-3 text-gray-500 hover:text-gray-700"
            >
              <X size={20} />
            </button>

            <h3 className="text-xl font-bold text-gray-900 mb-4">
              Create New Post
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Image Upload Area */}
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 flex flex-col items-center justify-center bg-gray-50">
                {newPost.image ? (
                  <div className="relative w-full">
                    <img
                      src={newPost.image}
                      alt="Selected"
                      className="w-full h-48 object-cover rounded-md"
                    />
                    <button
                      type="button"
                      onClick={() => setNewPost({ ...newPost, image: null })}
                      className="absolute top-2 right-2 bg-white bg-opacity-70 rounded-full p-1 text-gray-700 hover:text-red-500"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ) : (
                  <>
                    <Upload size={40} className="text-gray-400 mb-2" />
                    <p className="text-sm text-gray-500 mb-2">Upload image</p>
                    <p className="text-xs text-gray-400 mb-4">
                      PNG, JPG or GIF (max. 5MB)
                    </p>
                    <label className="cursor-pointer bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium">
                      Select Image
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="hidden"
                      />
                    </label>
                  </>
                )}
              </div>

              {/* Caption Input */}
              <div>
                <label
                  htmlFor="caption"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Caption
                </label>
                <textarea
                  id="caption"
                  rows="3"
                  value={newPost.caption}
                  onChange={handleCaptionChange}
                  placeholder="Write a caption for your post..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                ></textarea>
              </div>

              {/* Submit Button */}
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    setNewPost({ image: null, imageFile: null, caption: "" });
                  }}
                  className="mr-2 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!newPost.image || !newPost.caption}
                  className={`px-4 py-2 text-sm font-medium text-white rounded-md ${
                    newPost.image && newPost.caption
                      ? "bg-blue-600 hover:bg-blue-700"
                      : "bg-blue-400 cursor-not-allowed"
                  }`}
                >
                  Post
                </button>
              </div>
            </form>
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
        .grad-text {
          background: linear-gradient(to right, #dc2430, #7b4397);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
      `}</style>

      {/* Status Popup for success and error messages */}
      {statusPopup.show && (
        <div className={`fixed bottom-5 right-5 max-w-md px-6 py-4 rounded-lg shadow-lg z-50 transition-all duration-300 ${
          statusPopup.type === 'success' 
            ? 'bg-green-50 border-l-4 border-green-500 text-green-700' 
            : 'bg-red-50 border-l-4 border-red-500 text-red-700'
        }`}>
          <div className="flex items-center space-x-3">
            {statusPopup.type === 'success' ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            )}
            <p className="font-medium">{statusPopup.message}</p>
            <button 
              onClick={() => setStatusPopup({ show: false, message: "", type: "" })}
              className="ml-auto -mx-1.5 -my-1.5 rounded-lg focus:ring-2 focus:ring-gray-400 p-1.5 inline-flex h-8 w-8 hover:bg-gray-200"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;
