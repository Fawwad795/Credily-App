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
import AdditionalInfo from "./pages/AdditionalInfo";
import ProtectedRoute from "./components/ProtectedRoute";
import NotFoundPage from "./pages/NotFoundPage";
import { SliderProvider } from "./contexts/SliderContext";
import { ThemeProvider } from "./components/Nav";

const App = () => {
  console.log("App component rendering with SliderProvider");
  return (
    <ThemeProvider>
      <SliderProvider>
        <Router>
          <Routes>
            <Route path="/" element={<Navigate to="/home" />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/login" element={<Login />} />
            <Route path="/search" element={<SearchPage />} />
            <Route path="/additional-info" element={<AdditionalInfo />} />

            <Route 
              path="/home" 
              element={<ProtectedRoute element={<Home />} />} 
            />
            <Route 
              path="/profile" 
              element={<ProtectedRoute element={<Profile />} />} 
            />
            <Route 
              path="/profile/:id" 
              element={<ProtectedRoute element={<Follow />} />}
            />
            <Route 
              path="/messages" 
              element={<ProtectedRoute element={<MessagingPage />} />} 
            />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Router>
      </SliderProvider>
    </ThemeProvider>
  );
};

export default App;
