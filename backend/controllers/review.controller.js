import Review from "../models/review.model.js";
import User from "../models/user.model.js";

export const leaveReview = async (req, res) => {
  try {
    const { revieweeId, content, rating, categories, isAnonymous, isPublic } =
      req.body;
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

    // Create the review
    const review = await Review.create({
      reviewer: reviewerId,
      reviewee: revieweeId,
      content,
      rating,
      categories,
      isAnonymous,
      isPublic,
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
