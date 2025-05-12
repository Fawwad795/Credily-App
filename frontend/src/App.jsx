import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import MessagingPage from "./pages/Messages";
import Signup from "./pages/Signup";
import SearchPage from "./pages/SearchPage";
import Login from "./pages/Login";
import Home from "./pages/Home";
import Profile from "./pages/Profile";
import Follow from "./pages/Follow";
import Profile from "./pages/Profile";

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/home" />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/home" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/message" element={<MessagingPage />} />
        <Route path="/search" element={<SearchPage />} />
        <Route path="/profile" element={<Profile/>} />
        <Route path="/profile/:id" element={<Follow />} />
        <Route path="/profile" element={<Profile />} />
      </Routes>
    </Router>
  );
};

export default App;
