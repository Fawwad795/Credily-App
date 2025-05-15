import Review from "../models/review.model.js";
import User from "../models/user.model.js";
import analyzeSentiment from "../utils/sentiment.js";

export const leaveReview = async (req, res) => {
  try {
    const { revieweeId, content, categories, isAnonymous, isPublic } = req.body;
    const reviewerId = req.user.id; // Assuming `req.user` contains the authenticated user's ID

    const reviewee = await User.findById(revieweeId);
    if (!reviewee) {
      return res.status(404).json({
        success: false,
        message: "The user you are trying to review does not exist.",
      });
    }

    const reviewer = await User.findById(reviewerId);

    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

    const existingReview = await Review.findOne({
      reviewer: reviewerId,
      reviewee: revieweeId,
      createdAt: { $gte: oneMonthAgo },
    });

    if (existingReview) {
      return res.status(403).json({
        success: false,
        message: "You can only leave a review for this user once a month.",
      });
    }

    // Analyze sentiment of the review content
    const sentimentResult = await analyzeSentiment(content);

    // Create the review with sentiment data
    const review = await Review.create({
      reviewer: reviewerId,
      reviewee: revieweeId,
      content,
      categories,
      isAnonymous,
      isPublic,
      sentiment: sentimentResult.sentimentLabel,
      sentimentDetails: {
        score: sentimentResult.score,
        magnitude: sentimentResult.magnitude,
      },
    });

    res.status(201).json({
      success: true,
      message: "Review submitted successfully.",
      data: review,
    });
  } catch (error) {
    console.error("Error leaving review:", error);
    res.status(500).json({
      success: false,
      message: "Failed to leave review.",
      error: error.message,
    });
  }
};

// Get all reviews for a specific user
export const getUserReviews = async (req, res) => {
  try {
    const { userId } = req.params;

    // Check if userId is a valid MongoDB ObjectId
    if (!userId || userId.length !== 24) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID format",
      });
    }

    // Validate if the user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Fetch reviews where the user is the reviewee
    const reviews = await Review.find({
      reviewee: userId,
      isPublic: true,
      isActive: true,
    })
      .populate({
        path: "reviewer",
        select: "username firstName lastName profilePicture",
      })
      .sort({ createdAt: -1 }); // Sort by newest first

    // Calculate average rating
    const avgRating = await Review.calculateAverageRating(userId);

    res.status(200).json({
      success: true,
      data: {
        reviews,
        averageRating: avgRating,
        count: reviews.length,
      },
    });
  } catch (error) {
    console.error("Error fetching reviews:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch reviews",
      error: error.message,
    });
  }
};

export const analyzeSentimentRealtime = async (req, res) => {
  try {
    const { content } = req.body;

    if (!content || typeof content !== "string") {
      return res.status(400).json({
        success: false,
        message: "Content is required and must be a string",
      });
    }

    // Only analyze if there's meaningful text (more than just a few characters)
    if (content.trim().length < 5) {
      return res.status(200).json({
        success: true,
        data: {
          sentimentLabel: "neutral",
          score: 0,
          magnitude: 0,
        },
      });
    }

    // Analyze the sentiment
    const sentimentResult = await analyzeSentiment(content);

    res.status(200).json({
      success: true,
      data: {
        sentimentLabel: sentimentResult.sentimentLabel,
        score: sentimentResult.score,
        magnitude: sentimentResult.magnitude,
      },
    });
  } catch (error) {
    console.error("Error analyzing sentiment in real-time:", error);
    res.status(500).json({
      success: false,
      message: "Failed to analyze sentiment",
      error: error.message,
    });
  }
};
