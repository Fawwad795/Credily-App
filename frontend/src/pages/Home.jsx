import { Link } from "react-router-dom";
import Nav from "../components/Nav";

const Home = () => {
  return (
    <div className="bg-red-200 h-screen home-grid w-screen">
      <div className="">
        <Nav />
      </div>
      <div className="text-center">Home Page</div>
      <div className="">3</div>
    </div>
  );
};

export default Home;
