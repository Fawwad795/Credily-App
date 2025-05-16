import React from "react";
import { format } from "date-fns";
import { useTheme } from "./Nav"; // Import useTheme

const ReviewList = ({ reviews, isLoading }) => {
  const { darkMode } = useTheme(); // Use the theme context

  // Generate placeholder image for reviewer avatar
  const generateAvatar = (username) => {
    const colors = ["blue", "teal", "green", "orange", "red"];
    // Use a simple hash of the username to pick a consistent color
    const colorIndex = username
      ? username.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0) %
        colors.length
      : Math.floor(Math.random() * colors.length);
    const color = colors[colorIndex];
    const initial = username ? username.charAt(0).toUpperCase() : "?";
    return `https://placehold.co/50/${color}/white?text=${initial}`;
  };

  // Function to format date
  const formatDate = (dateString) => {
    try {
      return format(new Date(dateString), "MMM d, yyyy");
    } catch {
      return "Unknown date";
    }
  };

  // Function to render category tags
  const renderCategoryTags = (categories) => {
    if (!categories || categories.length === 0) return null;

    return (
      <div className="flex flex-wrap gap-2 mt-2">
        {categories.map((category, idx) => (
          <span
            key={idx}
            className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full"
          >
            {category}
          </span>
        ))}
      </div>
    );
  };

  // Function to render deduced trait tags with their appropriate colors
  const renderTraitTags = (traits, sentiment) => {
    if (!traits || traits.length === 0) return null;

    // Define color schemes based on sentiment categories
    const colorMap = {
      "critically negative": "bg-red-100 text-red-800",
      negative: "bg-orange-100 text-orange-800",
      neutral: "bg-gray-100 text-gray-800",
      positive: "bg-green-100 text-green-800",
      "critically positive": "bg-emerald-100 text-emerald-800",
    };

    // Default color if sentiment is undefined
    const defaultColor = "bg-blue-100 text-blue-800";
    const colorClass = sentiment ? colorMap[sentiment] : defaultColor;

    return (
      <div className="flex flex-wrap gap-2 mt-2">
        {traits.map((trait, idx) => (
          <span
            key={idx}
            className={`px-2 py-1 ${colorClass} text-xs rounded-full capitalize`}
          >
            {trait}
          </span>
        ))}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className={`max-w-4xl mx-auto my-6 ${
        darkMode ? "bg-gray-800" : "bg-white"
      } rounded-lg shadow-md p-6 animate-pulse`}>
        <div className={`h-7 ${
          darkMode ? "bg-gray-700" : "bg-gray-200"
        } rounded w-1/4 mb-4`}></div>
        <div className="space-y-4">
          {[1, 2, 3].map((item) => (
            <div key={item} className="flex space-x-4">
              <div className={`rounded-full ${
                darkMode ? "bg-gray-700" : "bg-gray-200"
              } h-12 w-12`}></div>
              <div className="flex-1">
                <div className={`h-4 ${
                  darkMode ? "bg-gray-700" : "bg-gray-200"
                } rounded w-1/4 mb-2`}></div>
                <div className={`h-4 ${
                  darkMode ? "bg-gray-700" : "bg-gray-200"
                } rounded mb-2`}></div>
                <div className={`h-4 ${
                  darkMode ? "bg-gray-700" : "bg-gray-200"
                } rounded w-3/4`}></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={`max-w-4xl mx-auto my-6 ${
      darkMode ? "bg-gray-800" : "bg-white"
    } rounded-lg shadow-md p-6`}>
      <h2 className={`text-xl font-bold ${
        darkMode ? "text-white" : "text-gray-800"
      } mb-4`}>Reviews</h2>

      {/* Vertical Scrolling Container */}
      <div className="max-h-96 overflow-y-auto space-y-4 hide-scrollbar">
        {reviews && reviews.length > 0 ? (
          reviews.map((review, index) => {
            // Always display as anonymous regardless of the isAnonymous flag
            const reviewerName = "Anonymous Reviewer";
            const reviewerImage = generateAvatar("Anonymous");

            return (
              <div
                key={review._id || index}
                className={`flex flex-col space-y-3 ${
                  darkMode ? "bg-gray-700" : "bg-gray-50"
                } p-4 rounded-lg shadow-sm`}
              >
                <div className="flex items-start space-x-4">
                  {/* Reviewer Image */}
                  <img
                    src={reviewerImage}
                    alt={reviewerName}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                  {/* Review Header */}
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <h5 className={`text-sm font-bold ${
                        darkMode ? "text-white" : "text-gray-800"
                      }`}>
                        {reviewerName}
                      </h5>
                      <span className={`text-xs ${
                        darkMode ? "text-gray-400" : "text-gray-500"
                      }`}>
                        {formatDate(review.createdAt)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Review Content */}
                <p className={`text-sm ${
                  darkMode ? "text-gray-300" : "text-gray-600"
                } ml-16 -mt-1`}>
                  {review.content}
                </p>

                {/* Category Tags */}
                <div className="ml-16 -mt-1">
                  {renderCategoryTags(review.categories)}
                </div>

                {/* Deduced Trait Tags */}
                {review.deducedTraits && review.deducedTraits.length > 0 && (
                  <div className="ml-16 -mt-1">
                    {renderTraitTags(review.deducedTraits, review.sentiment)}
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div className="text-center py-8">
            <p className={`${darkMode ? "text-gray-400" : "text-gray-500"}`}>No reviews yet.</p>
          </div>
        )}
      </div>

      {/* Custom style for hiding scrollbar while maintaining functionality */}
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

export default ReviewList;
