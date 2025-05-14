import React, { useState, useEffect } from "react";
import background from "../assets/background.png"; // Updated path to reference assets directory
import { useNavigate } from "react-router-dom";

const Signup = () => {
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

      // Navigate to the additional info page after successful registration
      navigate("/additional-info", { state: { user: data.data } });
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
      className="min-h-screen grid grid-cols-2 bg-cover bg-center flex items-center justify-center"
      style={{
        backgroundImage: `url(${background})`,
        backgroundSize: "120%", // Scales the background image to 120% of its original size
        backgroundRepeat: "no-repeat", // Prevents the image from repeating
        backgroundPosition: "center", // Ensures the image is centered
      }}
    >
      <div className="bg-opacity-50 p-8 rounded-lg w-full flex justify-center items-center flex-col  h-full ">
        <div className="flex flex-col justify-center items-start">
          <div className="font-black text-7xl ml-7 mb-7">
            Connect With Those Who Matter The Most
          </div>
          <div className="ml-8 text-xl">
            Join Credily now and become a part of our community!
          </div>
        </div>
      </div>
      <div className="flex justify-center items-center w-full h-full">
        <form
          onSubmit={handleSubmit}
          className="p-8 rounded-lg shadow-2xl  glass "
        >
          <h2 className="text-3xl font-bold mb-6 text-center text-black">
            Create an Account
          </h2>

          {/* Show error message if any */}
          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
              {error}
            </div>
          )}

          <div className="mb-4">
            <label className="block text-black font-medium mb-2">
              Username
            </label>
            <div className="relative">
              <input
                type="text"
                value={username}
                onChange={handleUsernameChange}
                required
                disabled={loading}
                className={`w-full px-4 py-2 border rounded-lg glass text-gray-800 focus:outline-none focus:ring-2 ${
                  usernameError
                    ? "border-red-500 focus:ring-red-500"
                    : usernameStatus === "available"
                    ? "border-green-500 focus:ring-green-500"
                    : "focus:ring-teal-400"
                }`}
                placeholder="Choose a username"
              />
              {usernameStatus === "checking" && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <svg
                    className="animate-spin h-5 w-5 text-gray-500"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                </div>
              )}
              {usernameStatus === "available" && username.length >= 3 && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 text-green-500"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
              )}
            </div>
            {usernameError && (
              <p className="mt-1 text-sm text-red-600">{usernameError}</p>
            )}
            {usernameStatus === "available" &&
              username.length >= 3 &&
              !usernameError && (
                <p className="mt-1 text-sm text-green-600">
                  Username available
                </p>
              )}
            {usernameStatus === "taken" && !usernameError && (
              <p className="mt-1 text-sm text-red-600">
                Username already taken
              </p>
            )}
          </div>

          <div className="mb-4">
            <label className="block text-black font-medium mb-2">
              Phone Number
            </label>
            <div className="flex">
              <select
                value={countryCode}
                onChange={handleCountryCodeChange}
                className="px-4 py-2 border rounded-l-lg glass text-gray-800 focus:outline-none focus:ring-2 focus:ring-teal-400 mr-2 cursor-pointer"
              >
                {countries.map((country) => (
                  <option key={country.code} value={country.code}>
                    {country.flag} {country.code}
                  </option>
                ))}
              </select>
              <div className="relative flex-grow">
                <input
                  type="tel"
                  value={phone}
                  onChange={handlePhoneChange}
                  required
                  className={`w-full px-4 py-2 border rounded-r-lg glass text-gray-800 focus:outline-none focus:ring-2 ${
                    phoneError
                      ? "border-red-500 focus:ring-red-500"
                      : phoneStatus === "available" && phone.length === 10
                      ? "border-green-500 focus:ring-green-500"
                      : "focus:ring-teal-400"
                  }`}
                  placeholder="Enter your phone number (10 digits)"
                />
                {phoneStatus === "checking" && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <svg
                      className="animate-spin h-5 w-5 text-gray-500"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                  </div>
                )}
                {phoneStatus === "available" && phone.length === 10 && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5 text-green-500"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                )}
              </div>
            </div>
            {phoneError && (
              <p className="mt-1 text-sm text-red-600">{phoneError}</p>
            )}
          </div>

          <div className="mb-4">
            <label className="block text-black font-medium mb-2">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={handlePasswordChange}
              required
              disabled={loading}
              className={`w-full px-4 py-2 border glass rounded-lg text-gray-800 focus:outline-none focus:ring-2 ${
                passwordError
                  ? "border-red-500 focus:ring-red-500"
                  : "focus:ring-teal-400"
              }`}
              placeholder="Enter your password"
            />
            {passwordError && (
              <p className="mt-1 text-sm text-red-600">{passwordError}</p>
            )}
          </div>

          <div className="mb-6 relative">
            <label className="block text-black font-medium mb-2">
              Confirm Password
            </label>
            <div className="relative">
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                disabled={loading}
                className={`w-full px-4 py-2 border rounded-lg glass text-black focus:outline-none focus:ring-2 ${
                  confirmPassword && !passwordsMatch
                    ? "border-red-500 focus:ring-red-500"
                    : "focus:ring-teal-400"
                } ${
                  passwordsMatch && confirmPassword ? "border-green-500" : ""
                }`}
                placeholder="Confirm your password"
              />
              {passwordsMatch && confirmPassword && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 text-green-500"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
              )}
            </div>
            {confirmPassword && !passwordsMatch && (
              <p className="mt-1 text-sm text-red-600">
                Passwords do not match
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={
              loading ||
              phoneError ||
              passwordError ||
              (confirmPassword && !passwordsMatch) ||
              usernameStatus === "taken" ||
              usernameError ||
              !username ||
              !phone ||
              phone.length !== 10 ||
              !password ||
              !confirmPassword ||
              (username.length >= 3 && usernameStatus !== "available") ||
              (phone.length === 10 && phoneStatus !== "available")
            }
            className={`w-full grad text-white py-2 px-4 rounded-lg hover:bg-teal-600 transition duration-300 cursor-pointer ${
              loading ||
              phoneError ||
              passwordError ||
              (confirmPassword && !passwordsMatch) ||
              usernameStatus === "taken" ||
              usernameError ||
              !username ||
              !phone ||
              phone.length !== 10 ||
              !password ||
              !confirmPassword ||
              (username.length >= 3 && usernameStatus !== "available") ||
              (phone.length === 10 && phoneStatus !== "available")
                ? "opacity-70 cursor-not-allowed"
                : ""
            }`}
          >
            {loading ? "Creating Account..." : "Signup"}
          </button>

          <p className="text-center text-black mt-4">
            Already have an account?{" "}
            <a
              href="/login"
              className="text-purple-900 hover:underline cursor-pointer"
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
