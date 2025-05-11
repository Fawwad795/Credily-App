import Review from "../models/review.model.js";
import User from "../models/user.model.js";

export const leaveReview = async (req, res) => {
  try {
    const { revieweeId, content, rating, categories, isAnonymous, isPublic } = req.body;
    const reviewerId = req.user.id; // Assuming `req.user` contains the authenticated user's ID

    // Check if the reviewee exists
    const reviewee = await User.findById(revieweeId);
    if (!reviewee) {
      return res.status(404).json({
        success: false,
        message: "The user you are trying to review does not exist.",
      });
    }

    const reviewer = await User.findById(reviewerId);
    const accountAge = (Date.now() - new Date(reviewer.createdAt)) / (1000 * 60 * 60 * 24); // Age in days
    if (accountAge < 30) {
      return res.status(403).json({
        success: false,
        message: "Your account must be at least 1 month old to leave a review.",
      });
    }
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