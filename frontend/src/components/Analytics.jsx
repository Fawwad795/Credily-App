import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";

const Analytics = ({ userId }) => {
  const [analyticsData, setAnalyticsData] = useState({
    traits: [],
    credibility: 0,
    optimism: 0,
    reputationScore: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hasReviews, setHasReviews] = useState(false);
  const location = useLocation();

  // Get progress bar color based on position (1st, 2nd, 3rd trait)
  const getProgressBarColor = (index) => {
    const colors = [
      "bg-blue-600", // First trait - blue
      "bg-emerald-500", // Second trait - emerald
      "bg-purple-600", // Third trait - purple
    ];

    return colors[index] || "bg-gray-500"; // Default fallback
  };

  // Get text color based on position (1st, 2nd, 3rd trait)
  const getTextColor = (index) => {
    const colors = [
      "text-blue-700", // First trait
      "text-emerald-700", // Second trait
      "text-purple-700", // Third trait
    ];

    return colors[index] || "text-gray-700"; // Default fallback
  };

  useEffect(() => {
    const fetchAnalyticsData = async () => {
      if (!userId) return;

      try {
        setLoading(true);
        const response = await fetch(`/api/reviews/analytics/${userId}`);

        if (!response.ok) {
          throw new Error("Failed to fetch analytics data");
        }

        const data = await response.json();

        if (data.success) {
          setAnalyticsData(data.data);
          // Check if there are any traits to display
          setHasReviews(data.data.traits && data.data.traits.length > 0);
        } else {
          setError(data.message || "Failed to load analytics");
        }
      } catch (err) {
        console.error("Error fetching analytics:", err);
        setError("Failed to load analytics data");
      } finally {
        setLoading(false);
      }
    };

    fetchAnalyticsData();
  }, [userId, location.pathname]);

  // If no reviews, don't show the analytics section
  if (!loading && !error && !hasReviews) {
    return null;
  }

  return (
    <div className="max-w-4xl mx-auto my-3 bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-bold text-gray-800 mb-4">Analytics</h2>

      {loading ? (
        <div className="text-center py-3">
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-3"></div>
            <div className="h-4 bg-gray-200 rounded w-full mb-3"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
          </div>
        </div>
      ) : error ? (
        <div className="text-center text-red-500 py-3">{error}</div>
      ) : (
        <>
          {/* Trait Progress Bars */}
          {analyticsData.traits &&
            analyticsData.traits.map((traitData, index) => (
              <div className="mb-4" key={index}>
                <div className="flex justify-between mb-1">
                  <span
                    className={`text-sm font-medium capitalize ${getTextColor(
                      index
                    )}`}
                  >
                    {traitData.trait}
                  </span>
                  <span
                    className={`text-sm font-medium ${getTextColor(index)}`}
                  >
                    {traitData.percentage}%
                  </span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-3">
                  <div
                    className={`${getProgressBarColor(
                      index
                    )} h-3 rounded-full transition-all duration-500 ease-in-out`}
                    style={{ width: `${traitData.percentage}%` }}
                  ></div>
                </div>
              </div>
            ))}

          {/* Additional context */}
          <p className="text-xs text-gray-500 mt-2">
            These metrics are calculated based on user interactions and feedback
            received over time.
          </p>
        </>
      )}
    </div>
  );
};

export default Analytics;
