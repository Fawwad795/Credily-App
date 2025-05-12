import React from "react";

const ReviewList = ({ reviews }) => {
  // Generate placeholder image for reviewer avatar
  const generateAvatar = (index) => {
    const colors = ["blue", "teal", "green", "orange", "red"];
    const color = colors[index % colors.length];
    const text = `R${index + 1}`;
    return `https://placehold.co/50/${color}/white?text=${text}`;
  };

  return (
    <div className="max-w-4xl mx-auto my-6 bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-bold text-gray-800 mb-4">Reviews</h2>

      {/* Vertical Scrolling Container */}
      <div className="max-h-64 overflow-y-auto space-y-4 hide-scrollbar">
        {reviews.map((review, index) => (
          <div
            key={index}
            className="flex items-start space-x-4 bg-gray-50 p-4 rounded-lg shadow-sm"
          >
            {/* Reviewer Image */}
            <img
              src={review.image || generateAvatar(index)}
              alt={`Reviewer ${index + 1}`}
              className="w-12 h-12 rounded-full object-cover"
            />
            {/* Review Content */}
            <div>
              <h5 className="text-sm font-bold text-gray-800">
                {review.name || `Reviewer ${index + 1}`}
              </h5>
              <p className="text-sm text-gray-600">
                {review.content || "This is a sample review content."}
              </p>
            </div>
          </div>
        ))}
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
