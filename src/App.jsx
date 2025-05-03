import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import MessagingPage from "./Messages";
import Signup from "./Signup";
import SearchPage from "./SearchPage"; // Import SearchPage
import Login from "./Login";
import Home from "./Home";

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/signup" element={<Signup />} />
        <Route path="/home" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/message" element={<MessagingPage />} />
        <Route path="/search" element={<SearchPage />} />{" "}
        {/* Add SearchPage route */}
      </Routes>
    </Router>
  );
};

export default App;
