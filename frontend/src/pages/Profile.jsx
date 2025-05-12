
import React, { useState, useEffect, useRef } from 'react';
import { CheckCircle, MapPin, Pencil, X, Upload, Camera } from 'lucide-react';
import { useLocation } from "react-router-dom";
import Nav from '../components/Nav';
import ReviewList from '../components/ReviewList';
import PostSection from '../components/PostSection';
import Analytics from '../components/Analytics';

const reviewsData = [
  {
    name: "Alice",
    image: "https://via.placeholder.com/50?text=A",
    content: "Really insightful content!",
  },
  {
    name: "Bob", 
    image: "https://via.placeholder.com/50?text=B",
    content: "Great attention to detail and presentation.",
  },
  {
    name: "Charlie",
    content: "I loved the way the topic was covered!",
  },
];

const samplePosts = [
  {
    title: "Project Update 1",
    description: "Implemented new UI design for user dashboard.",
    image: "https://via.placeholder.com/300x160?text=Post+1",
    date: "May 11, 2025",
    likes: 24,
    comments: 8,
  },
  {
    title: "New Feature Launch", 
    description: "Launched AI assistant for student queries.",
    image: "https://via.placeholder.com/300x160?text=Post+2",
    date: "May 12, 2025",
    likes: 30,
    comments: 12,
  },
];

const Profile = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [profile, setProfile] = useState();
  const [connections, setConnections] = useState(0);
  const [newPost, setNewPost] = useState({
    image: null,
    caption: ''
  });
  

  const location = useLocation();
  const user = location.state?.user;

  useEffect(() => {
    const fetchProfileAndConnections = async () => {
      if (!user || !user._id) {
        console.error("No user ID found");
        return;
      }

      try {
        const [profileRes, connRes] = await Promise.all([
          fetch(`http://localhost:4000/api/users/profile/${user._id}`),
          fetch(`http://localhost:4000/api/users/${user._id}/connections`)
        ]);

        const profileData = await profileRes.json();
        const connData = await connRes.json();

        console.log('Profile Data:', profileData);
        console.log('Connections Data:', connData);

        if (profileData.success) {
          setProfile(profileData.data);
        } else {
          console.error("Failed to fetch profile data:", profileData.message);
          
        }

        if (connData.success) {
          setConnections(connData.data.totalConnections);
        } else {
          console.error("Failed to fetch connections data:", connData.message);
        }
      } catch (error) {
        console.error("Failed to fetch user data:", error);
      }
    };

    fetchProfileAndConnections();
    console.log('Profile:', profile);
  }, []);

  useEffect(() => {
    if (profile) {
      console.log("Profile updated:", profile);
    }
  }, [profile]);

  const handleImageChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setNewPost({
        ...newPost,
        image: URL.createObjectURL(file)
      });
    }
  };

  const handleCaptionChange = (e) => {
    setNewPost({
      ...newPost,
      caption: e.target.value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('New post data:', newPost);
    setIsModalOpen(false);
    setNewPost({ image: null, caption: '' });
  };

  

  if (!profile) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }
  return (
    <div className="flex h-screen w-screen">
      {/* Nav Bar */}
      <div className="w-[24%]">
        <Nav />
      </div>

      <div className="w-[76%] h-screen overflow-y-auto bg-gray-100">
        {/* Profile Section */}

        <div className="max-w-4xl mx-auto my-6 bg-white rounded-lg shadow-md p-6">


<div className={`${profile.profilePicture} h-48 relative`}>
  <div className="absolute inset-0 bg-black opacity-10"></div>

  <div className="absolute inset-0">
    <div className="absolute top-0 left-0 w-1/3 h-px bg-red-300 opacity-30"></div>
    <div className="absolute bottom-0 left-0 w-px h-1/4 bg-blue-300 opacity-30"></div>
    <div className="absolute bottom-0 right-0 w-1/3 h-px bg-teal-300 opacity-30"></div>
    <div className="absolute top-1/2 right-1/4 w-64 h-64 rounded-full border border-pink-200 opacity-20"></div>
    <div className="absolute bottom-0 right-0 w-64 h-64 border-t border-l border-gray-300 opacity-20"></div>

    {/* Small dots pattern */}
    <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.2) 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
  </div>

  {/* Username and Email */}
  <div className="absolute bottom-0 left-32 right-0 p-4 text-white">
    <h1 className="text-4xl font-bold">{profile.username}</h1>
    <p className="text-gray-200">{profile.username}</p>
  </div>

  {/* Edit Button */}
  <button className="absolute top-4 right-4 p-2 rounded-full bg-white bg-opacity-10 hover:bg-opacity-20">
    <Pencil size={18} className="text-white" />
  </button>
</div>

<div className="relative px-6 py-4">
  {/* Profile Picture */}
  <div className="absolute -top-16 left-6 rounded-full border-4 border-white overflow-hidden">
    <img 
      src={profile.profilePicture} 
      alt="Profile avatar" 
      className="w-24 h-24 object-cover"
    />
  </div>

  {/* Profile Info - Below the avatar */}
  <div className="mt-12">
    <div className="flex items-center">
      <h2 className="text-2xl font-bold text-gray-800">{profile.username}</h2>
      {profile.isVerified && (
        <CheckCircle size={20} className="ml-2 text-blue-600 fill-blue-600" />
      )}
    </div>

    <p className="text-gray-700 mt-1 max-w-lg">{profile.username}</p>

    <div className="flex items-center text-gray-600 mt-2">
      <MapPin size={16} className="mr-1" />
      <span>{profile.username}</span>
      <span className="mx-2 text-blue-600 font-medium cursor-pointer">· Connections {connections}</span>
    </div>


  </div>


</div>
</div>

        {/* Analytics Section */}
        
       <Analytics/>
        {/* Reviews Section */}
       <ReviewList reviews={reviewsData} />

        {/* Posts Section - Horizontal Scrolling */}
       <PostSection posts={samplePosts} onCreate={() => setIsModalOpen(true)}/>
       {isModalOpen && <div>Your modal component goes here</div>}
      </div>

      {/* Create New Post Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-white bg-opacity-10 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6 relative">
            {/* Close button */}
            <button 
              onClick={() => {
                setIsModalOpen(false);
                setNewPost({ image: null, caption: '' });
              }}
              className="absolute top-3 right-3 text-gray-500 hover:text-gray-700"
            >
              <X size={20} />
            </button>
            
            <h3 className="text-xl font-bold text-gray-900 mb-4">Create New Post</h3>
            
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
                      onClick={() => setNewPost({...newPost, image: null})}
                      className="absolute top-2 right-2 bg-white bg-opacity-70 rounded-full p-1 text-gray-700 hover:text-red-500"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ) : (
                  <>
                    <Upload size={40} className="text-gray-400 mb-2" />
                    <p className="text-sm text-gray-500 mb-2">Upload image</p>
                    <p className="text-xs text-gray-400 mb-4">PNG, JPG or GIF (max. 5MB)</p>
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
                <label htmlFor="caption" className="block text-sm font-medium text-gray-700 mb-1">
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
                    setNewPost({ image: null, caption: '' });
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
                      ? 'bg-blue-600 hover:bg-blue-700' 
                      : 'bg-blue-400 cursor-not-allowed'
                  }`}
                >
                  Post
                </button>
              </div>
            </form>
    
          </div>
        
        </div>
      )}
     
    </div>
  );
};

export default Profile;