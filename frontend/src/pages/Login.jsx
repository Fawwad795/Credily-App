import React, { useState } from "react";
import background from "../assets/background.png"; // Light mode background
import darkBackground from "../assets/dark-background.jpeg"; // Dark mode background
import { useNavigate, Link } from "react-router-dom";
import { useTheme } from "../components/Nav"; // Import useTheme hook

const Login = () => {
  const { darkMode, toggleDarkMode } = useTheme(); // Use the dark mode context
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Reset error state
    setError("");

    // Validate username
    if (!username.trim()) {
      setError("Username is required!");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch("/api/users/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message);
      }

      // Store user data and token
      localStorage.setItem("user", JSON.stringify(data.data));
      localStorage.setItem("token", data.token);

      // Redirect to home page after successful login
      navigate("/home");
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className={`min-h-screen grid sm:grid-cols-1 sm:grid-rows-2 md:grid-cols-2 md:grid-rows-1 lg:grid-cols-2 lg:grid-rows-1 bg-cover bg-center ${
        darkMode ? "text-white" : ""
      }`}
      style={{
        backgroundImage: `url(${darkMode ? darkBackground : background})`,
        backgroundSize: "120%", // Scales the background image to 120% of its original size
        backgroundRepeat: "no-repeat", // Prevents the image from repeating
        backgroundPosition: "center", // Ensures the image is centered
      }}
    >
      {/* Dark mode toggle button */}
      <button
        onClick={toggleDarkMode}
        className="fixed top-4 right-4 z-50 p-2 rounded-full focus:outline-none bg-opacity-80 shadow-lg transition-all"
        style={{
          backgroundColor: darkMode
            ? "rgba(30, 41, 59, 0.8)"
            : "rgba(255, 255, 255, 0.8)",
        }}
        aria-label="Toggle dark mode"
      >
        {darkMode ? (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="5"></circle>
            <line x1="12" y1="1" x2="12" y2="3"></line>
            <line x1="12" y1="21" x2="12" y2="23"></line>
            <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
            <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
            <line x1="1" y1="12" x2="3" y2="12"></line>
            <line x1="21" y1="12" x2="23" y2="12"></line>
            <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
            <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
          </svg>
        ) : (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="black"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
          </svg>
        )}
      </button>

      {/* Left Section */}
      <div className="bg-opacity-50 p-8 rounded-lg w-full flex justify-center items-center flex-col h-full">
        <div className="flex flex-col justify-center items-start">
          <div
            className={`font-black font-bold text-7xl ml-7 mb-7 ${
              darkMode ? "text-white" : ""
            }`}
          >
            Welcome Back!
          </div>
          <div className={`ml-8 text-xl ${darkMode ? "text-gray-200" : ""}`}>
            Log in to continue connecting with your community.
          </div>
        </div>
      </div>

      {/* Right Section */}
      <div className="flex justify-center items-center w-full h-full">
        <form
          onSubmit={handleSubmit}
          className={`p-8 rounded-lg shadow-2xl ${
            darkMode
              ? "bg-gray-800/80 text-white border border-gray-700"
              : "glass"
          }`}
        >
          <h2
            className={`text-3xl font-bold mb-6 text-center ${
              darkMode ? "text-white" : "text-black"
            }`}
          >
            Login to Your Account
          </h2>

          {/* Show error message if any */}
          {error && (
            <div
              className={`mb-4 p-3 ${
                darkMode
                  ? "bg-red-900/50 border-red-800 text-red-200"
                  : "bg-red-100 border-red-400 text-red-700"
              } border rounded`}
            >
              {error}
            </div>
          )}

          <div className="mb-4">
            <label
              className={`block font-medium mb-2 ${
                darkMode ? "text-gray-200" : "text-black"
              }`}
            >
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              disabled={loading}
              className={`w-full px-4 py-2 border rounded-lg ${
                darkMode
                  ? "bg-gray-700 border-gray-600 text-white focus:ring-purple-500"
                  : "glass text-gray-800 focus:ring-teal-400"
              } focus:outline-none focus:ring-2`}
              placeholder="Enter your username"
            />
          </div>

          <div className="mb-6">
            <label
              className={`block font-medium mb-2 ${
                darkMode ? "text-gray-200" : "text-black"
              }`}
            >
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
              className={`w-full px-4 py-2 border rounded-lg ${
                darkMode
                  ? "bg-gray-700 border-gray-600 text-white focus:ring-purple-500"
                  : "glass text-gray-800 focus:ring-teal-400"
              } focus:outline-none focus:ring-2`}
              placeholder="Enter your password"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full grad text-white py-2 px-4 rounded-lg hover:bg-teal-600 transition duration-300 cursor-pointer"
          >
            {loading ? "Logging in..." : "Login"}
          </button>

          <p
            className={`text-center mt-4 ${
              darkMode ? "text-gray-300" : "text-black"
            }`}
          >
            Don't have an account?{" "}
            <Link
              to="/signup"
              className={`${
                darkMode ? "text-purple-400" : "text-purple-900"
              } hover:underline cursor-pointer`}
            >
              Signup
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
};

export default Login;
