import React, { useState, useEffect } from "react";
import background from "../assets/background.png"; // Light mode background
import darkBackground from "../assets/dark-background.jpeg"; // Dark mode background
import { useNavigate } from "react-router-dom";
import { useTheme } from "../components/Nav"; // Import useTheme hook

const Signup = () => {
  const { darkMode, toggleDarkMode } = useTheme(); // Use the dark mode context
  const [username, setUsername] = useState("");
  const [usernameStatus, setUsernameStatus] = useState(""); // "available", "taken", "checking", or ""
  const [usernameError, setUsernameError] = useState("");
  const [phone, setPhone] = useState("");
  const [phoneStatus, setPhoneStatus] = useState(""); // "available", "taken", "checking", or ""
  const [phoneError, setPhoneError] = useState("");
  const [countryCode, setCountryCode] = useState("+92");
  const [password, setPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordsMatch, setPasswordsMatch] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Check if passwords match whenever either password field changes
  useEffect(() => {
    if (confirmPassword && password) {
      setPasswordsMatch(password === confirmPassword);
    } else {
      setPasswordsMatch(false);
    }
  }, [password, confirmPassword]);

  // Check username availability with a debounce
  useEffect(() => {
    // Reset status when empty
    if (!username || username.length < 3) {
      setUsernameStatus("");
      return;
    }

    // Set up debounce for username check
    const timer = setTimeout(() => {
      checkUsernameAvailability(username);
    }, 500); // Wait 500ms after typing stops before checking

    return () => clearTimeout(timer); // Clean up timer
  }, [username]);

  // Check phone number availability with a debounce
  useEffect(() => {
    // Reset status when empty
    if (!phone || phone.length !== 10) {
      setPhoneStatus("");
      return;
    }

    // Set up debounce for phone check
    const timer = setTimeout(() => {
      checkPhoneAvailability(countryCode, phone);
    }, 500); // Wait 500ms after typing stops before checking

    return () => clearTimeout(timer); // Clean up timer
  }, [phone, countryCode]);

  const checkUsernameAvailability = async (username) => {
    if (username.length < 3) return;

    try {
      setUsernameStatus("checking");

      const response = await fetch(`/api/users/check-username/${username}`);

      // Handle non-JSON responses gracefully
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        console.warn("Non-JSON response from username check API");
        setUsernameStatus("");
        return;
      }

      const data = await response.json();

      if (response.ok) {
        if (data.available) {
          setUsernameStatus("available");
          setUsernameError("");
        } else {
          setUsernameStatus("taken");
          setUsernameError("Username already taken");
        }
      } else {
        setUsernameStatus("");
        setUsernameError("");
      }
    } catch (error) {
      console.error("Error checking username:", error);
      setUsernameStatus("");
    }
  };

  const checkPhoneAvailability = async (countryCode, phoneNumber) => {
    if (phoneNumber.length !== 10) return;

    try {
      setPhoneStatus("checking");

      // Format the full phone number
      const fullPhoneNumber = `${countryCode} ${phoneNumber}`;

      const response = await fetch(
        `/api/users/check-phone/${encodeURIComponent(fullPhoneNumber)}`
      );

      // Handle non-JSON responses gracefully
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        console.warn("Non-JSON response from phone check API");
        setPhoneStatus("");
        return;
      }

      const data = await response.json();

      if (response.ok) {
        if (data.available) {
          setPhoneStatus("available");
          setPhoneError("");
        } else {
          setPhoneStatus("taken");
          setPhoneError(
            "An account is already registered with this phone number"
          );
        }
      } else {
        setPhoneStatus("");
        setPhoneError("");
      }
    } catch (error) {
      console.error("Error checking phone number:", error);
      setPhoneStatus("");
    }
  };

  const handleUsernameChange = (e) => {
    const value = e.target.value;
    // Only allow up to 15 characters
    if (value.length <= 15) {
      setUsername(value);

      // Basic validation
      if (value.length < 3 && value.length > 0) {
        setUsernameError("Username must be at least 3 characters long");
        setUsernameStatus("");
      } else if (value.length === 0) {
        setUsernameError("");
        setUsernameStatus("");
      } else if (value.length > 15) {
        setUsernameError("Username cannot be more than 15 characters long");
        setUsernameStatus("");
      } else {
        setUsernameError("");
        // Status will be updated by the useEffect
      }
    }
  };

  const handlePasswordChange = (e) => {
    const value = e.target.value;
    setPassword(value);

    if (value.length < 6 && value.length > 0) {
      setPasswordError("Password must be at least 6 characters long");
    } else {
      setPasswordError("");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Reset error states
    setError("");
    setPhoneError("");
    setPasswordError("");
    setUsernameError("");

    // Validate username
    if (!username.trim()) {
      setUsernameError("Username is required!");
      return;
    }

    // Validate username length
    if (username.length < 3) {
      setUsernameError("Username must be at least 3 characters long");
      return;
    }

    // Validate maximum username length
    if (username.length > 15) {
      setUsernameError("Username cannot be more than 15 characters long");
      return;
    }

    // Check if username is taken
    if (usernameStatus === "taken") {
      setUsernameError("Username already taken");
      return;
    }

    // Validate phone number (exactly 10 digits)
    if (phone.length !== 10) {
      setPhoneError("Phone number must be exactly 10 digits");
      return;
    }

    // Check if phone is already registered
    if (phoneStatus === "taken") {
      setPhoneError("An account is already registered with this phone number");
      return;
    }

    // Validate password length
    if (password.length < 6) {
      setPasswordError("Password must be at least 6 characters long");
      return;
    }

    // Validate passwords match
    if (password !== confirmPassword) {
      setError("Passwords do not match!");
      return;
    }

    // Create the full phone number with country code
    const fullPhoneNumber = `${countryCode} ${phone}`;

    try {
      setLoading(true);

      const response = await fetch("/api/users/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username,
          phoneNumber: fullPhoneNumber,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Handle specific error cases
        if (
          data.message?.includes("username") &&
          data.message?.includes("taken")
        ) {
          setUsernameError("Username already taken");
          throw new Error("Username already taken");
        }
        throw new Error(data.message || "Registration failed");
      }

      // Store the token in localStorage immediately
      localStorage.setItem("token", data.token);

      // Navigate to the additional info page after successful registration
      navigate("/additional-info", {
        state: {
          user: data.data,
          token: data.token, // Pass the token to the next page
        },
      });
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePhoneChange = (e) => {
    const value = e.target.value;
    // Only allow numbers and limit to 10 digits
    if (/^\d*$/.test(value) && value.length <= 10) {
      setPhone(value);
      if (value.length === 10 || value.length === 0) {
        setPhoneError("");
      } else {
        setPhoneError("Phone number must be exactly 10 digits");
        setPhoneStatus("");
      }
    }
  };

  const handleCountryCodeChange = (e) => {
    setCountryCode(e.target.value);
    // If phone is already fully entered, check availability with new country code
    if (phone.length === 10) {
      // Use setTimeout to prevent immediate API call - let the state update first
      setTimeout(() => {
        checkPhoneAvailability(e.target.value, phone);
      }, 100);
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
      className={`min-h-screen grid sm:grid-cols-1 sm:grid-rows-2 md:grid-cols-2 md:grid-rows-1 lg:grid-cols-2 lg:grid-rows-1 bg-cover bg-center ${
        darkMode ? "text-white" : ""
      }`}
      style={{
        backgroundImage: `url(${darkMode ? darkBackground : background})`,
        backgroundSize: "120%",
        backgroundRepeat: "no-repeat",
        backgroundPosition: "center"
      }}
    >
      {/* Dark mode toggle button */}
      <button
        onClick={toggleDarkMode}
        className="fixed top-4 right-4 z-50 p-2 rounded-full focus:outline-none bg-opacity-80 shadow-lg transition-all"
        style={{
          backgroundColor: darkMode ? "rgba(30, 41, 59, 0.8)" : "rgba(255, 255, 255, 0.8)"
        }}
        aria-label="Toggle dark mode"
      >
        {darkMode ? (
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
          </svg>
        )}
      </button>

      {/* Left Section */}
      <div className="bg-opacity-50 p-8 rounded-lg w-full flex justify-center items-center flex-col h-full">
        <div className="flex flex-col justify-center items-start">
          <div className={`font-black text-7xl ml-7 mb-7 ${darkMode ? "text-white" : ""}`}>
            Join Credily!
          </div>
          <div className={`ml-8 text-xl ${darkMode ? "text-gray-200" : ""}`}>
            Connect with friends and the world around you.
          </div>
        </div>
      </div>

      {/* Right Section - Form Container */}
      <div className="flex justify-center items-center w-full h-full">
        <form
          onSubmit={handleSubmit}
          className={`p-8 rounded-lg shadow-2xl ${
            darkMode 
              ? "bg-gray-800/80 text-white border border-gray-700" 
              : "glass"
          } max-w-lg w-full mx-4`}
        >
          <h2 className={`text-3xl font-bold mb-6 text-center ${
            darkMode ? "text-white" : "text-black"
          }`}>
            Create an Account
          </h2>

          {/* Show form error message if any */}
          {error && (
            <div className={`mb-4 p-3 ${
              darkMode 
                ? "bg-red-900/50 border-red-800 text-red-200" 
                : "bg-red-100 border-red-400 text-red-700"
            } border rounded`}>
              {error}
            </div>
          )}

          {/* Username Field */}
          <div className="mb-4">
            <label className={`block font-medium mb-2 ${
              darkMode ? "text-gray-200" : "text-black"
            }`}>
              Username
            </label>
            <div className="relative">
              <input
                type="text"
                value={username}
                onChange={handleUsernameChange}
                required
                disabled={loading}
                maxLength={15}
                className={`w-full px-4 py-2 border rounded-lg ${
                  darkMode 
                    ? "bg-gray-700 border-gray-600 text-white focus:ring-purple-500" 
                    : "glass text-gray-800 focus:ring-teal-400"
                } focus:outline-none focus:ring-2 ${
                  usernameStatus === "available"
                    ? "border-green-500"
                    : usernameStatus === "taken"
                    ? "border-red-500"
                    : ""
                }`}
                placeholder="Choose a username"
              />
              {/* Username status indicators */}
              {usernameStatus === "checking" && (
                <div className={`absolute right-3 top-3 ${
                  darkMode ? "text-blue-300" : "text-blue-500"
                }`}>
                  Checking...
                </div>
              )}
              {usernameStatus === "available" && (
                <div className="absolute right-3 top-3 text-green-500">
                  Available ✓
                </div>
              )}
              {usernameStatus === "taken" && (
                <div className="absolute right-3 top-3 text-red-500">
                  Taken ✗
                </div>
              )}
            </div>
            {usernameError && (
              <p className={`mt-1 text-sm ${
                darkMode ? "text-red-300" : "text-red-500"
              }`}>{usernameError}</p>
            )}
          </div>

          {/* Phone Number Field */}
          <div className="mb-4">
            <label className={`block font-medium mb-2 ${
              darkMode ? "text-gray-200" : "text-black"
            }`}>
              Phone Number
            </label>
            <div className="flex space-x-2">
              <select
                value={countryCode}
                onChange={handleCountryCodeChange}
                className={`px-2 py-2 border rounded-lg ${
                  darkMode 
                    ? "bg-gray-700 border-gray-600 text-white focus:ring-purple-500" 
                    : "glass text-gray-800 focus:ring-teal-400"
                } focus:outline-none focus:ring-2`}
                disabled={loading}
              >
                <option value="+92">+92 (PK)</option>
                <option value="+1">+1 (US)</option>
                <option value="+44">+44 (UK)</option>
                <option value="+91">+91 (IN)</option>
                {/* Add more country codes as needed */}
              </select>

              <div className="relative flex-1">
                <input
                  type="text"
                  value={phone}
                  onChange={handlePhoneChange}
                  required
                  disabled={loading}
                  className={`w-full px-4 py-2 border rounded-lg ${
                    darkMode 
                      ? "bg-gray-700 border-gray-600 text-white focus:ring-purple-500" 
                      : "glass text-gray-800 focus:ring-teal-400"
                  } focus:outline-none focus:ring-2 ${
                    phoneStatus === "available"
                      ? "border-green-500"
                      : phoneStatus === "taken"
                      ? "border-red-500"
                      : ""
                  }`}
                  placeholder="Enter your phone number"
                />
                {/* Phone status indicators */}
                {phoneStatus === "checking" && (
                  <div className={`absolute right-3 top-3 ${
                    darkMode ? "text-blue-300" : "text-blue-500"
                  }`}>
                    Checking...
                  </div>
                )}
                {phoneStatus === "available" && (
                  <div className="absolute right-3 top-3 text-green-500">
                    Available ✓
                  </div>
                )}
                {phoneStatus === "taken" && (
                  <div className="absolute right-3 top-3 text-red-500">
                    Taken ✗
                  </div>
                )}
              </div>
            </div>
            {phoneError && (
              <p className={`mt-1 text-sm ${
                darkMode ? "text-red-300" : "text-red-500"
              }`}>{phoneError}</p>
            )}
          </div>

          {/* Password Field */}
          <div className="mb-4">
            <label className={`block font-medium mb-2 ${
              darkMode ? "text-gray-200" : "text-black"
            }`}>
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={handlePasswordChange}
              required
              disabled={loading}
              className={`w-full px-4 py-2 border rounded-lg ${
                darkMode 
                  ? "bg-gray-700 border-gray-600 text-white focus:ring-purple-500" 
                  : "glass text-gray-800 focus:ring-teal-400"
              } focus:outline-none focus:ring-2`}
              placeholder="Choose a password"
            />
            {passwordError && (
              <p className={`mt-1 text-sm ${
                darkMode ? "text-red-300" : "text-red-500"
              }`}>{passwordError}</p>
            )}
          </div>

          {/* Confirm Password Field */}
          <div className="mb-6">
            <label className={`block font-medium mb-2 ${
              darkMode ? "text-gray-200" : "text-black"
            }`}>
              Confirm Password
            </label>
            <div className="relative">
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                disabled={loading}
                className={`w-full px-4 py-2 border rounded-lg ${
                  darkMode 
                    ? "bg-gray-700 border-gray-600 text-white focus:ring-purple-500" 
                    : "glass text-gray-800 focus:ring-teal-400"
                } focus:outline-none focus:ring-2 ${
                  confirmPassword && (passwordsMatch ? "border-green-500" : "border-red-500")
                }`}
                placeholder="Confirm your password"
              />
              {confirmPassword && (
                <div
                  className={`absolute right-3 top-3 ${
                    passwordsMatch ? "text-green-500" : "text-red-500"
                  }`}
                >
                  {passwordsMatch ? "Matching ✓" : "Not matching ✗"}
                </div>
              )}
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full grad text-white py-2 px-4 rounded-lg hover:bg-teal-600 transition duration-300 cursor-pointer focus:outline-none focus:ring-2 focus:ring-teal-400"
          >
            {loading ? "Creating account..." : "Sign Up"}
          </button>

          {/* Login Link */}
          <p className={`text-center mt-4 ${
            darkMode ? "text-gray-300" : "text-black"
          }`}>
            Already have an account?{" "}
            <a
              href="/login"
              className={`${
                darkMode ? "text-purple-400" : "text-purple-900"
              } hover:underline cursor-pointer`}
            >
              Login
            </a>
          </p>
        </form>
      </div>
    </div>
  );
};

export default Signup;
