import React from "react";
import { format } from "date-fns";

const ReviewList = ({ reviews, isLoading, averageRating }) => {
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

  // Function to render stars based on rating
  const renderStars = (rating) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <span
          key={i}
          className={`text-xl ${
            i <= rating ? "text-yellow-500" : "text-gray-300"
          }`}
        >
          ★
        </span>
      );
    }
    return <div className="flex">{stars}</div>;
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

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto my-6 bg-white rounded-lg shadow-md p-6 animate-pulse">
        <div className="h-7 bg-gray-200 rounded w-1/4 mb-4"></div>
        <div className="space-y-4">
          {[1, 2, 3].map((item) => (
            <div key={item} className="flex space-x-4">
              <div className="rounded-full bg-gray-200 h-12 w-12"></div>
              <div className="flex-1">
                <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto my-6 bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-bold text-gray-800 mb-4">Reviews</h2>

      {/* Average Rating Display */}
      {averageRating > 0 && (
        <div className="mb-4 flex items-center">
          <span className="text-gray-700 mr-2">Average Rating:</span>
          <div className="flex">
            {[1, 2, 3, 4, 5].map((star) => (
              <span
                key={star}
                className={`text-xl ${
                  star <= Math.round(averageRating)
                    ? "text-yellow-500"
                    : "text-gray-300"
                }`}
              >
                ★
              </span>
            ))}
          </div>
          <span className="ml-2 text-sm text-gray-600">
            ({averageRating.toFixed(1)})
          </span>
        </div>
      )}

      {/* Vertical Scrolling Container */}
      <div className="max-h-96 overflow-y-auto space-y-4 hide-scrollbar">
        {reviews && reviews.length > 0 ? (
          reviews.map((review, index) => {
            const reviewerName = review.reviewer
              ? review.reviewer.firstName && review.reviewer.lastName
                ? `${review.reviewer.firstName} ${review.reviewer.lastName}`
                : review.reviewer.username
              : `Reviewer ${index + 1}`;

            const reviewerImage =
              review.reviewer && review.reviewer.profilePicture
                ? review.reviewer.profilePicture
                : generateAvatar(reviewerName);

            return (
              <div
                key={review._id || index}
                className="flex flex-col space-y-3 bg-gray-50 p-4 rounded-lg shadow-sm"
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
                      <h5 className="text-sm font-bold text-gray-800">
                        {reviewerName}
                      </h5>
                      <span className="text-xs text-gray-500">
                        {formatDate(review.createdAt)}
                      </span>
                    </div>
                    {/* Rating */}
                    {renderStars(review.rating)}
                  </div>
                </div>

                {/* Review Content */}
                <p className="text-sm text-gray-600 ml-16 -mt-1">
                  {review.content}
                </p>

                {/* Category Tags */}
                <div className="ml-16 -mt-1">
                  {renderCategoryTags(review.categories)}
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-500">No reviews yet.</p>
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
