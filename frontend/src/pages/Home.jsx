import { Link } from "react-router-dom";
import Nav from "../components/Nav";
import PostCard from "../components/PostCard";

const Home = () => {
  const posts = [
    {
      authorName: "Alice",
      authorImage: "https://via.placeholder.com/50?text=A",
      postImage: "https://via.placeholder.com/300x160?text=Post+1",
      postCaption: "Exploring the beauty of nature.",
      comments: ["Amazing!", "Beautiful scenery!", "Love this!"],
    },
    {
      authorName: "Bob",
      authorImage: "https://via.placeholder.com/50?text=B",
      postImage: "https://via.placeholder.com/300x160?text=Post+2",
      postCaption: "A day in the life of a developer.",
      comments: ["So relatable!", "Great post!", "Keep it up!"],
    },
    {
      authorName: "Charlie",
      authorImage: "https://via.placeholder.com/50?text=C",
      postImage: "https://via.placeholder.com/300x160?text=Post+3",
      postCaption: "Tips for staying productive.",
      comments: ["Very helpful!", "Thanks for sharing!", "Great tips!"],
    },
    {
      authorName: "Diana",
      authorImage: "https://via.placeholder.com/50?text=D",
      postImage: "https://via.placeholder.com/300x160?text=Post+4",
      postCaption: "My latest photography project.",
      comments: ["Stunning shots!", "You're so talented!", "Love this!"],
    },
  ];

  const peopleYouKnow = [
    { name: "Eve", image: "https://via.placeholder.com/50?text=E" },
    { name: "Frank", image: "https://via.placeholder.com/50?text=F" },
    { name: "Grace", image: "https://via.placeholder.com/50?text=G" },
    { name: "Hank", image: "https://via.placeholder.com/50?text=H" },
    { name: "Ivy", image: "https://via.placeholder.com/50?text=I" },
  ];

  return (
    <div className="h-screen home-grid w-screen">
      <div>
        <Nav />
      </div>
      <div className="text-center">
        {/* Vertically Scrollable Post Section */}
        <div className="w-full h-20 flex justify-center items-center font-bold text-5xl sticky">
          <i>Credily</i>
        </div>
        <div className="h-screen overflow-y-auto px-4 hide-scrollbar">
          {posts.map((post, index) => (
            <div key={index}>
              <PostCard
                authorName={post.authorName}
                authorImage={post.authorImage}
                postImage={post.postImage}
                postCaption={post.postCaption}
                comments={post.comments}
              />
            </div>
          ))}
        </div>
      </div>

      {/* People You Know Section */}
      <div className="w-full flex flex-col items-center  p-4">
        <div className="mt-5 font-bold text-lg">People You Know</div>
        <ul className="mt-4 w-full  space-y-4">
          {peopleYouKnow.map((person, index) => (
            <li key={index} className="flex items-center rounded-lg space-y-2 shadow-sm space-x-4">
              <img
                src={person.image}
                alt={person.name}
                className="w-12 h-12 rounded-full object-cover"
              />
              <p className="text-sm font-medium text-gray-800">{person.name}</p>
            </li>
          ))}
        </ul>
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

export default Home;
