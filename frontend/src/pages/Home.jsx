import { Link } from "react-router-dom";
import Nav from "../components/Nav";
import PostCard from "../components/PostCard";

const Home = () => {
  const posts = [
    {
      authorName: "Alice",
      authorImage: "https://placehold.co/50/blue/white?text=A",
      postImage: "https://placehold.co/600x350/blue/white?text=Post+1",
      postCaption: "Exploring the beauty of nature.",
      comments: ["Amazing!", "Beautiful scenery!", "Love this!"],
    },
    {
      authorName: "Bob",
      authorImage: "https://placehold.co/50/teal/white?text=B",
      postImage: "https://placehold.co/600x350/teal/white?text=Post+2",
      postCaption: "A day in the life of a developer.",
      comments: ["So relatable!", "Great post!", "Keep it up!"],
    },
    {
      authorName: "Charlie",
      authorImage: "https://placehold.co/50/green/white?text=C",
      postImage: "https://placehold.co/600x350/green/white?text=Post+3",
      postCaption: "Tips for staying productive.",
      comments: ["Very helpful!", "Thanks for sharing!", "Great tips!"],
    },
    {
      authorName: "Diana",
      authorImage: "https://placehold.co/50/orange/white?text=D",
      postImage: "https://placehold.co/600x350/orange/white?text=Post+4",
      postCaption: "My latest photography project.",
      comments: ["Stunning shots!", "You're so talented!", "Love this!"],
    },
  ];

  const peopleYouKnow = [
    { name: "Eve", image: "https://placehold.co/50/red/white?text=E" },
    { name: "Frank", image: "https://placehold.co/50/purple/white?text=F" },
    { name: "Grace", image: "https://placehold.co/50/pink/white?text=G" },
    { name: "Hank", image: "https://placehold.co/50/cyan/white?text=H" },
    { name: "Ivy", image: "https://placehold.co/50/indigo/white?text=I" },
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
            <li
              key={index}
              className="flex items-center rounded-lg space-y-2 shadow-sm space-x-4"
            >
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

export default Home;
