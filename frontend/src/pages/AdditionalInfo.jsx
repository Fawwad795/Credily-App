import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import background from "../assets/background.png"; // Light mode background
import darkBackground from "../assets/dark-background.jpeg"; // Dark mode background
import { compressImage, isImageTooLarge } from "../utils/imageCompression";
import { useTheme } from "../components/Nav"; // Import useTheme hook

// Moved validateEmail outside the component to break dependency cycle
const validateEmail = (email) => {
  if (!email) return true; // Email is optional, so empty is fine
  const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
  return emailRegex.test(email);
};

const AdditionalInfo = () => {
  const { darkMode, toggleDarkMode } = useTheme(); // Use the dark mode context
  const navigate = useNavigate();
  const location = useLocation();
  const user = location.state?.user;

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [emailStatus, setEmailStatus] = useState(""); // "available", "taken", "checking", or ""
  const [bio, setBio] = useState("");
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("");
  const [profileImage, setProfileImage] = useState(null);
  const [profileImagePreview, setProfileImagePreview] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [formProgress, setFormProgress] = useState(33);

  // Countries list for the dropdown
  const countries = [
    "United States",
    "United Kingdom",
    "Canada",
    "Australia",
    "Germany",
    "France",
    "India",
    "Japan",
    "China",
    "Brazil",
    "Mexico",
    "South Africa",
    "Italy",
    "Spain",
    "Russia",
    "Pakistan",
    "Indonesia",
    "Netherlands",
    "Sweden",
    "Norway",
  ];

  // Major cities list for the dropdown (simplified for demo)
  const cities = {
    "United States": [
      "New York",
      "Los Angeles",
      "Chicago",
      "Houston",
      "Phoenix",
      "Philadelphia",
      "San Antonio",
      "San Diego",
      "Dallas",
      "San Jose",
    ],
    "United Kingdom": [
      "London",
      "Birmingham",
      "Manchester",
      "Glasgow",
      "Liverpool",
      "Bristol",
      "Edinburgh",
      "Leeds",
      "Sheffield",
      "Newcastle",
    ],
    Canada: [
      "Toronto",
      "Montreal",
      "Vancouver",
      "Calgary",
      "Edmonton",
      "Ottawa",
      "Quebec City",
      "Winnipeg",
      "Hamilton",
      "Kitchener",
    ],
    Australia: [
      "Sydney",
      "Melbourne",
      "Brisbane",
      "Perth",
      "Adelaide",
      "Gold Coast",
      "Canberra",
      "Newcastle",
      "Wollongong",
      "Hobart",
    ],
    Germany: [
      "Berlin",
      "Hamburg",
      "Munich",
      "Cologne",
      "Frankfurt",
      "Stuttgart",
      "Düsseldorf",
      "Leipzig",
      "Dortmund",
      "Essen",
    ],
    France: [
      "Paris",
      "Marseille",
      "Lyon",
      "Toulouse",
      "Nice",
      "Nantes",
      "Strasbourg",
      "Montpellier",
      "Bordeaux",
      "Lille",
    ],
    India: [
      "Mumbai",
      "Delhi",
      "Bangalore",
      "Hyderabad",
      "Ahmedabad",
      "Chennai",
      "Kolkata",
      "Surat",
      "Pune",
      "Jaipur",
    ],
    Japan: [
      "Tokyo",
      "Yokohama",
      "Osaka",
      "Nagoya",
      "Sapporo",
      "Fukuoka",
      "Kobe",
      "Kyoto",
      "Kawasaki",
      "Saitama",
    ],
    China: [
      "Shanghai",
      "Beijing",
      "Guangzhou",
      "Shenzhen",
      "Tianjin",
      "Chongqing",
      "Chengdu",
      "Nanjing",
      "Wuhan",
      "Xi'an",
    ],
    Brazil: [
      "São Paulo",
      "Rio de Janeiro",
      "Brasília",
      "Salvador",
      "Fortaleza",
      "Belo Horizonte",
      "Manaus",
      "Curitiba",
      "Recife",
      "Porto Alegre",
    ],
    Mexico: [
      "Mexico City",
      "Guadalajara",
      "Monterrey",
      "Puebla",
      "Tijuana",
      "León",
      "Juárez",
      "Zapopan",
      "Querétaro",
      "Mérida",
    ],
    "South Africa": [
      "Johannesburg",
      "Cape Town",
      "Durban",
      "Pretoria",
      "Port Elizabeth",
      "Bloemfontein",
      "Nelspruit",
      "Kimberley",
      "Polokwane",
      "Rustenburg",
    ],
    Italy: [
      "Rome",
      "Milan",
      "Naples",
      "Turin",
      "Palermo",
      "Genoa",
      "Bologna",
      "Florence",
      "Catania",
      "Bari",
    ],
    Spain: [
      "Madrid",
      "Barcelona",
      "Valencia",
      "Seville",
      "Zaragoza",
      "Málaga",
      "Murcia",
      "Palma",
      "Las Palmas",
      "Bilbao",
    ],
    Russia: [
      "Moscow",
      "Saint Petersburg",
      "Novosibirsk",
      "Yekaterinburg",
      "Kazan",
      "Chelyabinsk",
      "Omsk",
      "Samara",
      "Rostov-on-Don",
      "Ufa",
    ],
    Pakistan: [
      "Karachi",
      "Lahore",
      "Faisalabad",
      "Rawalpindi",
      "Gujranwala",
      "Peshawar",
      "Multan",
      "Hyderabad",
      "Islamabad",
      "Quetta",
    ],
    Indonesia: [
      "Jakarta",
      "Surabaya",
      "Bandung",
      "Medan",
      "Semarang",
      "Makassar",
      "Palembang",
      "Tangerang",
      "Depok",
      "Padang",
    ],
    Netherlands: [
      "Amsterdam",
      "Rotterdam",
      "The Hague",
      "Utrecht",
      "Eindhoven",
      "Tilburg",
      "Groningen",
      "Almere",
      "Breda",
      "Nijmegen",
    ],
    Sweden: [
      "Stockholm",
      "Gothenburg",
      "Malmö",
      "Uppsala",
      "Västerås",
      "Örebro",
      "Linköping",
      "Helsingborg",
      "Jönköping",
      "Norrköping",
    ],
    Norway: [
      "Oslo",
      "Bergen",
      "Trondheim",
      "Stavanger",
      "Drammen",
      "Fredrikstad",
      "Kristiansand",
      "Sandnes",
      "Tromsø",
      "Sarpsborg",
    ],
  };

  // Default to empty array if no country is selected yet
  const availableCities = country ? cities[country] || [] : [];

  // If no user data is passed, redirect to signup
  useEffect(() => {
    if (!user) {
      navigate("/signup");
    }
  }, [user, navigate]);

  // Update progress when step changes
  useEffect(() => {
    if (currentStep === 1) setFormProgress(33);
    else if (currentStep === 2) setFormProgress(66);
    else if (currentStep === 3) setFormProgress(100);
  }, [currentStep]);

  // Check email availability with a debounce when email changes
  useEffect(() => {
    // Skip if email is empty or invalid
    if (!email || !validateEmail(email)) {
      setEmailStatus("");
      return;
    }

    // Set up debounce for email check
    const timer = setTimeout(() => {
      // Define the check function inside useEffect to avoid dependency issues
      const checkEmail = async () => {
        try {
          setEmailStatus("checking");

          const response = await fetch(
            `/api/users/check-email/${encodeURIComponent(email.toLowerCase())}`
          );

          // Handle non-JSON responses gracefully
          const contentType = response.headers.get("content-type");
          if (!contentType || !contentType.includes("application/json")) {
            console.warn("Non-JSON response from email check API");
            setEmailStatus("");
            return;
          }

          const data = await response.json();

          if (response.ok) {
            if (data.available) {
              setEmailStatus("available");
              setEmailError("");
            } else {
              setEmailStatus("taken");
              setEmailError("This email is already in use by another account.");
            }
          } else {
            setEmailStatus("");
            setEmailError("");
          }
        } catch (error) {
          console.error("Error checking email:", error);
          setEmailStatus("");
        }
      };

      checkEmail();
    }, 500); // Wait 500ms after typing stops before checking

    return () => clearTimeout(timer); // Clean up timer
  }, [email]); // Remove validateEmail from dependencies

  // Check for token in location state or localStorage
  useEffect(() => {
    // Get token from the navigate state (from signup) if available
    const token = location?.state?.token;

    // If token is available in location state, save it to localStorage
    if (token) {
      localStorage.setItem("token", token);
    }
  }, [location]);

  const handleEmailChange = (e) => {
    const value = e.target.value;
    // Convert to lowercase immediately
    const lowercaseValue = value.toLowerCase();
    setEmail(lowercaseValue);

    if (lowercaseValue && !validateEmail(lowercaseValue)) {
      setEmailError(
        "Please enter a valid email address (e.g., name@example.com)"
      );
      setEmailStatus("");
    } else {
      setEmailError("");
      // Status will be updated by the useEffect
    }
  };

  // Remove the local compressImage function and update handleImageChange
  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      // Show preview with original file
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileImagePreview(reader.result);
      };
      reader.readAsDataURL(file);

      // Compress image before setting it for upload
      try {
        // Check if image is too large
        if (isImageTooLarge(file)) {
          console.log(
            `Profile image is large (${(file.size / 1024 / 1024).toFixed(
              2
            )}MB), compressing...`
          );
        }

        // Compress using our shared utility
        const compressedFile = await compressImage(file);
        setProfileImage(compressedFile);
      } catch (err) {
        console.error("Error compressing image:", err);
        setProfileImage(file); // Fallback to original if compression fails
      }
    }
  };

  const handleNextStep = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Add function to capitalize first letter of names
  const capitalizeFirstLetter = (string) => {
    if (!string) return "";
    return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase();
  };

  // Update the handleSubmit function to capitalize names before submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // Validate email before submission
    if (email && !validateEmail(email)) {
      setEmailError(
        "Please enter a valid email address (e.g., name@example.com)"
      );
      return;
    }

    // Check if email is taken
    if (emailStatus === "taken") {
      setEmailError(
        "This email is already in use by another account. Please use a different email."
      );
      return;
    }

    setLoading(true);

    try {
      // Capitalize first and last names before submission
      const capitalizedFirstName = capitalizeFirstLetter(firstName);
      const capitalizedLastName = capitalizeFirstLetter(lastName);

      // Get authentication token - try from various sources
      const token =
        localStorage.getItem("token") ||
        localStorage.getItem("authToken") ||
        location?.state?.token;

      // First, update the user's additional info
      const response = await fetch(
        `/api/users/profile/${user._id}/additional-info`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            firstName: capitalizedFirstName,
            lastName: capitalizedLastName,
            email,
            bio,
            location: {
              city,
              country,
            },
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to update additional information"
        );
      }

      let updatedUser = data.data;

      // If profile image is selected, upload it to Cloudinary
      if (profileImage) {
        const formData = new FormData();
        formData.append("profilePicture", profileImage);

        const uploadResponse = await fetch(
          `/api/uploads/profile-picture/${user._id}`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`, // Add the token for authentication
            },
            body: formData,
          }
        );

        const uploadData = await uploadResponse.json();

        if (!uploadResponse.ok) {
          console.error(
            "Failed to upload profile picture:",
            uploadData.message
          );
          // Continue anyway since the profile info was updated successfully
        } else {
          // Update the user data with the new profile picture
          updatedUser = uploadData.data.user;
        }
      }

      // Navigate to profile page after successful setup
      navigate("/profile", { state: { user: updatedUser } });
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Render different steps
  const renderStep = () => {
    const availableCities = cities[country] || [];

    switch (currentStep) {
      case 1:
        return (
          <>
            <div className="flex flex-col items-center mb-6">
              <div
                className={`w-24 h-24 ${
                  darkMode ? 'bg-gray-700' : 'bg-gray-100'
                } rounded-full flex items-center justify-center overflow-hidden border-2 ${
                  darkMode ? 'border-gray-600' : 'border-gray-200'
                } relative cursor-pointer`}
              >
                {profileImagePreview ? (
                  <img
                    src={profileImagePreview}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex items-center justify-center w-full h-full">
                    <svg
                      className={`w-12 h-12 ${darkMode ? 'text-gray-500' : 'text-gray-300'}`}
                      fill="currentColor"
                      viewBox="0 0 20 20"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                )}
                <label className="absolute inset-0 flex items-center justify-center">
                  <span className="sr-only">Upload a photo</span>
                  <input
                    type="file"
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    onChange={handleImageChange}
                  />
                </label>
              </div>
              <p className={`text-center ${darkMode ? 'text-gray-400' : 'text-gray-500'} text-sm mt-2`}>
                Add a profile picture
              </p>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="firstname"
                    className={`block ${darkMode ? 'text-gray-300' : 'text-gray-700'} text-sm font-medium mb-1`}
                  >
                    First Name
                  </label>
                  <input
                    type="text"
                    id="firstname"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className={`w-full px-4 py-2 border ${
                      darkMode 
                        ? "bg-gray-700 border-gray-600 text-white focus:ring-purple-500" 
                        : "border-gray-300 focus:ring-teal-400 glass"
                    } rounded-md focus:outline-none focus:ring-2`}
                    placeholder="Enter your first name"
                  />
                </div>
                <div>
                  <label
                    htmlFor="lastname"
                    className={`block ${darkMode ? 'text-gray-300' : 'text-gray-700'} text-sm font-medium mb-1`}
                  >
                    Last Name
                  </label>
                  <input
                    type="text"
                    id="lastname"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className={`w-full px-4 py-2 border ${
                      darkMode 
                        ? "bg-gray-700 border-gray-600 text-white focus:ring-purple-500" 
                        : "border-gray-300 focus:ring-teal-400 glass"
                    } rounded-md focus:outline-none focus:ring-2`}
                    placeholder="Enter your last name"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="email"
                  className={`block ${darkMode ? 'text-gray-300' : 'text-gray-700'} text-sm font-medium mb-1`}
                >
                  Email Address
                </label>
                <div className="relative">
                  <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={handleEmailChange}
                    className={`w-full px-4 py-2 border ${
                      emailError
                        ? "border-red-500"
                        : emailStatus === "available" && email
                        ? "border-green-500"
                        : darkMode 
                          ? "border-gray-600" 
                          : "border-gray-300"
                    } rounded-md focus:outline-none focus:ring-2 ${
                      emailError
                        ? "focus:ring-red-500"
                        : emailStatus === "available" && email
                        ? "focus:ring-green-500"
                        : darkMode
                          ? "focus:ring-purple-500 bg-gray-700 text-white"
                          : "focus:ring-teal-400 glass"
                    }`}
                    placeholder="Enter your email address"
                  />
                  {emailStatus === "checking" && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <svg
                        className={`animate-spin h-5 w-5 ${darkMode ? 'text-blue-400' : 'text-gray-500'}`}
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
                  {emailStatus === "available" && email && !emailError && (
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
                {emailError && (
                  <p className={`mt-1 text-sm ${darkMode ? 'text-red-400' : 'text-red-600'}`}>
                    {emailError}
                  </p>
                )}
                {emailStatus === "available" && email && !emailError && (
                  <p className="mt-1 text-sm text-green-600">
                    Email is available
                  </p>
                )}
              </div>
            </div>
          </>
        );

      case 2:
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="country"
                  className={`block ${darkMode ? 'text-gray-300' : 'text-gray-700'} text-sm font-medium mb-1`}
                >
                  Country
                </label>
                <select
                  id="country"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 appearance-none ${
                    darkMode 
                      ? "bg-gray-700 border-gray-600 text-white focus:ring-purple-500" 
                      : "border-gray-300 focus:ring-teal-400 bg-white glass"
                  }`}
                >
                  <option value="" disabled>
                    Select a country
                  </option>
                  {countries.map((countryOption) => (
                    <option key={countryOption} value={countryOption}>
                      {countryOption}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label
                  htmlFor="city"
                  className={`block ${darkMode ? 'text-gray-300' : 'text-gray-700'} text-sm font-medium mb-1`}
                >
                  City
                </label>
                <select
                  id="city"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 appearance-none ${
                    darkMode 
                      ? "bg-gray-700 border-gray-600 text-white focus:ring-purple-500" 
                      : "border-gray-300 focus:ring-teal-400 bg-white glass"
                  }`}
                  disabled={!country}
                >
                  <option value="" disabled>
                    {country ? "Select a city" : "Select country first"}
                  </option>
                  {availableCities.map((cityOption) => (
                    <option key={cityOption} value={cityOption}>
                      {cityOption}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label
                htmlFor="bio"
                className={`block ${darkMode ? 'text-gray-300' : 'text-gray-700'} text-sm font-medium mb-1`}
              >
                Bio
              </label>
              <textarea
                id="bio"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows="4"
                className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                  darkMode 
                    ? "bg-gray-700 border-gray-600 text-white focus:ring-purple-500" 
                    : "border-gray-300 focus:ring-teal-400 glass"
                }`}
                placeholder="Tell us a bit about yourself"
                maxLength="100"
              ></textarea>
              <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'} text-right mt-1`}>
                {bio.length}/100 characters
              </p>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <div className={`w-20 h-20 mx-auto rounded-full overflow-hidden mb-4 ${
                darkMode ? 'bg-gray-700' : 'bg-gray-100'
              }`}>
                {profileImagePreview ? (
                  <img
                    src={profileImagePreview}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex items-center justify-center w-full h-full">
                    <svg
                      className={`w-12 h-12 ${darkMode ? 'text-gray-500' : 'text-gray-300'}`}
                      fill="currentColor"
                      viewBox="0 0 20 20"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                        clipRule="evenodd"
                      ></path>
                    </svg>
                  </div>
                )}
              </div>
              <h3 className={`text-xl font-medium ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>
                {capitalizeFirstLetter(firstName)}{" "}
                {capitalizeFirstLetter(lastName)}
              </h3>
              <p className={`${darkMode ? 'text-gray-400' : 'text-gray-500'} text-sm`}>
                {user.username} | {email}
              </p>
            </div>

            <div className={`${
              darkMode ? 'bg-gray-700' : 'bg-gray-50'
            } p-4 rounded-lg space-y-2 ${
              darkMode ? '' : 'glass'
            }`}>
              <div className="flex justify-between">
                <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  Location
                </span>
                <span className={`text-sm font-medium ${darkMode ? 'text-gray-200' : 'text-gray-900'}`}>
                  {city && country
                    ? `${city}, ${country}`
                    : city || country || "Not specified"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  Bio
                </span>
                <span className={`text-sm font-medium ${darkMode ? 'text-gray-200' : 'text-gray-900'} text-right max-w-[70%] truncate`}>
                  {bio || "Not provided"}
                </span>
              </div>
            </div>

            <div className={`text-center text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              <p>
                You can change these details from your profile page anytime.
              </p>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  if (!user) return null;

  return (
    <div
      className={`min-h-screen flex items-center justify-center bg-cover bg-center ${
        darkMode ? "text-white" : ""
      }`}
      style={{
        backgroundImage: `url(${darkMode ? darkBackground : background})`,
        backgroundSize: "120%",
        backgroundRepeat: "no-repeat",
        backgroundPosition: "center",
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
      
      <div className={`w-full max-w-md ${darkMode ? 'bg-gray-800/90 border border-gray-700' : 'glass'} rounded-2xl shadow-xl overflow-hidden`}>
        <div className="relative grad p-6 pb-8">
          <h1 className="text-2xl font-bold text-white">
            Complete Your Profile
          </h1>
          <p className="text-white text-sm mt-1">
            Step {currentStep} of 3:{" "}
            {currentStep === 1
              ? "Basic Info"
              : currentStep === 2
              ? "Location & Bio"
              : "Review"}
          </p>
          <div className="mt-4 h-2 bg-white/30 rounded-full">
            <div
              className="h-full bg-white rounded-full transition-all duration-300 ease-in-out"
              style={{ width: `${formProgress}%` }}
            ></div>
          </div>
        </div>

        {error && (
          <div className={`mx-6 mt-4 p-3 ${
            darkMode 
              ? "bg-red-900/50 border-red-800 text-red-200" 
              : "bg-red-50 border-red-200 text-red-700"
          } border rounded-md text-sm`}>
            {error}
          </div>
        )}

        <div className="p-6">
          <form onSubmit={(e) => e.preventDefault()}>
            {renderStep()}

            <div className="flex justify-between mt-8">
              <button
                type="button"
                onClick={handlePrevStep}
                className={`px-4 py-2 border ${
                  darkMode 
                    ? "border-gray-600 text-gray-300" 
                    : "border-gray-300 text-gray-700"
                } rounded-md ${
                  darkMode ? "bg-gray-700" : "glass"
                } cursor-pointer focus:outline-none focus:ring-0 ${
                  currentStep === 1
                    ? "opacity-50 cursor-not-allowed"
                    : darkMode 
                      ? "hover:bg-gray-600" 
                      : "hover:bg-gray-50"
                }`}
                disabled={currentStep === 1}
              >
                Back
              </button>

              {currentStep < 3 ? (
                <button
                  type="button"
                  onClick={handleNextStep}
                  className={`px-4 py-2 grad text-white rounded-md hover:opacity-90 focus:outline-none focus:ring-0 cursor-pointer ${
                    emailStatus === "taken" || emailError
                      ? "opacity-70 cursor-not-allowed"
                      : ""
                  }`}
                  disabled={emailStatus === "taken" || emailError}
                >
                  Continue
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={loading || emailError || emailStatus === "taken"}
                  className={`px-4 py-2 grad text-white rounded-md hover:opacity-90 focus:outline-none focus:ring-0 ${
                    loading || emailError || emailStatus === "taken"
                      ? "opacity-70 cursor-not-allowed"
                      : "cursor-pointer"
                  }`}
                >
                  {loading ? "Saving..." : "Complete Setup"}
                </button>
              )}
            </div>
          </form>

          <div className="text-center mt-4">
            <button
              type="button"
              onClick={() => navigate("/profile", { state: { user } })}
              className={`text-sm ${
                darkMode ? "text-gray-300" : ""
              } hover:underline cursor-pointer focus:outline-none focus:ring-0`}
            >
              Skip for now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdditionalInfo;
