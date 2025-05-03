import React, { useState } from "react";
import background from "../assets/background.png"; // Updated path for new structure
import { useNavigate, Link } from "react-router-dom";

const Login = () => {
  const [phone, setPhone] = useState("");
  const [countryCode, setCountryCode] = useState("+92"); // Default country code
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Reset error state
    setError("");

    // Create the full phone number with country code
    const fullPhoneNumber = `${countryCode} ${phone}`;

    try {
      setLoading(true);

      const response = await fetch("/api/users/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          phoneNumber: fullPhoneNumber,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Use the specific error message from the backend
        throw new Error(data.message);
      }

      // Store user data in localStorage or context
      localStorage.setItem("user", JSON.stringify(data.data));

      // Redirect to home page after successful login
      navigate("/home");
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const countries = [
    { code: "+1", flag: "🇺🇸" },
    { code: "+44", flag: "🇬🇧" },
    { code: "+91", flag: "🇮🇳" },
    { code: "+92", flag: "🇵🇰" },
    { code: "+61", flag: "🇦🇺" },
    { code: "+81", flag: "🇯🇵" },
    { code: "+49", flag: "🇩🇪" },
    { code: "+33", flag: "🇫🇷" },
    { code: "+86", flag: "🇨🇳" },
    { code: "+7", flag: "🇷🇺" },
  ];

  return (
    <div
      className="min-h-screen grid grid-cols-2 bg-cover bg-center flex items-center justify-center"
      style={{
        backgroundImage: `url(${background})`,
        backgroundSize: "120%", // Scales the background image to 120% of its original size
        backgroundRepeat: "no-repeat", // Prevents the image from repeating
        backgroundPosition: "center", // Ensures the image is centered
      }}
    >
      {/* Left Section */}
      <div className="bg-opacity-50 p-8 rounded-lg w-full flex justify-center items-center flex-col h-full">
        <div className="flex flex-col justify-center items-start">
          <div className="font-black text-7xl ml-7 mb-7">Welcome Back!</div>
          <div className="ml-8 text-xl">
            Log in to continue connecting with your community.
          </div>
        </div>
      </div>

      {/* Right Section */}
      <div className="flex justify-center items-center w-full h-full">
        <form
          onSubmit={handleSubmit}
          className="p-8 rounded-lg shadow-2xl glass"
        >
          <h2 className="text-3xl font-bold mb-6 text-center text-black">
            Login to Your Account
          </h2>

          {/* Show error message if any */}
          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
              {error}
            </div>
          )}

          <div className="mb-4">
            <label className="block text-black font-medium mb-2">
              Phone Number
            </label>
            <div className="flex">
              <select
                value={countryCode}
                onChange={(e) => setCountryCode(e.target.value)}
                className="px-4 py-2 border rounded-l-lg glass text-gray-800 focus:outline-none focus:ring-2 focus:ring-teal-400 mr-2" // Added `mr-2` for spacing
                disabled={loading}
              >
                {countries.map((country) => (
                  <option key={country.code} value={country.code}>
                    {country.flag} {country.code}
                  </option>
                ))}
              </select>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                onKeyPress={(e) => {
                  if (!/[0-9]/.test(e.key)) {
                    e.preventDefault(); // Prevent non-numeric input
                  }
                }}
                required
                disabled={loading}
                className="w-full px-4 py-2 border rounded-r-lg glass text-gray-800 focus:outline-none focus:ring-2 focus:ring-teal-400"
                placeholder="Enter your phone number"
              />
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-black font-medium mb-2">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
              className="w-full px-4 py-2 border rounded-lg glass text-gray-800 focus:outline-none focus:ring-2 focus:ring-teal-400"
              placeholder="Enter your password"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full grad text-white py-2 px-4 rounded-lg hover:bg-teal-600 transition duration-300"
          >
            {loading ? "Logging in..." : "Login"}
          </button>

          <p className="text-center text-black mt-4">
            Don't have an account?{" "}
            <Link to="/signup" className="text-purple-900 hover:underline">
              Signup
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
};

export default Login;
