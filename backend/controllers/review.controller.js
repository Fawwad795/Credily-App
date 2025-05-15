import Review from "../models/review.model.js";
import User from "../models/user.model.js";
import analyzeSentiment, { analyzeTraits } from "../utils/sentiment.js";

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
      deducedTraits: sentimentResult.traits || [], // Use traits from sentiment analysis
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
      .select(
        "reviewer reviewee content categories isAnonymous sentiment sentimentDetails deducedTraits createdAt updatedAt"
      )
      .sort({ createdAt: -1 }); // Sort by newest first

    // Calculate average rating
    const avgRating = await Review.calculateAverageRating(userId);

    // Aggregate traits for analytics
    let allTraits = [];
    reviews.forEach((review) => {
      if (review.deducedTraits && review.deducedTraits.length > 0) {
        allTraits = [...allTraits, ...review.deducedTraits];
      }
    });

    // Count trait occurrences
    const traitCount = {};
    allTraits.forEach((trait) => {
      traitCount[trait] = (traitCount[trait] || 0) + 1;
    });

    // Calculate trait percentages and sort by frequency
    const traits = Object.entries(traitCount)
      .map(([trait, count]) => ({
        trait,
        count,
        percentage: Math.round((count / Math.max(1, allTraits.length)) * 100),
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 3); // Take top 3 traits

    // Normalize percentages if we have few traits causing all to be 100%
    if (traits.length > 1 && traits.every((t) => t.percentage === 100)) {
      // Calculate relative percentages based on count
      const totalCount = traits.reduce((sum, t) => sum + t.count, 0);
      traits.forEach((trait) => {
        trait.percentage = Math.round((trait.count / totalCount) * 100);
      });
    }

    // Ensure minimum percentage for visibility
    traits.forEach((trait) => {
      if (trait.percentage < 10) trait.percentage = 10;
    });

    res.status(200).json({
      success: true,
      data: {
        reviews,
        averageRating: avgRating,
        count: reviews.length,
        traitStats: traits,
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
          traits: [],
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
        traits: sentimentResult.traits || [],
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

// Get trait analytics for a specific user
export const getUserTraitAnalytics = async (req, res) => {
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

    // Fetch reviews to analyze traits
    const reviews = await Review.find({
      reviewee: userId,
      isPublic: true,
      isActive: true,
    });

    if (reviews.length === 0) {
      return res.status(200).json({
        success: true,
        data: {
          traits: [],
          credibility: 0,
          optimism: 0,
          reputationScore: 0,
        },
      });
    }

    // Aggregate all traits from reviews
    let allTraits = [];
    let positiveCount = 0;
    let negativeCount = 0;
    let neutralCount = 0;

    reviews.forEach((review) => {
      // Count sentiment types
      if (
        review.sentiment === "critically positive" ||
        review.sentiment === "positive"
      ) {
        positiveCount++;
      } else if (
        review.sentiment === "critically negative" ||
        review.sentiment === "negative"
      ) {
        negativeCount++;
      } else {
        neutralCount++;
      }

      // Collect all traits
      if (review.deducedTraits && review.deducedTraits.length > 0) {
        allTraits = [...allTraits, ...review.deducedTraits];
      }
    });

    // Count trait occurrences
    const traitCount = {};
    allTraits.forEach((trait) => {
      traitCount[trait] = (traitCount[trait] || 0) + 1;
    });

    // Calculate trait percentages and sort by frequency
    const traits = Object.entries(traitCount)
      .map(([trait, count]) => ({
        trait,
        count,
        percentage: Math.round((count / Math.max(1, allTraits.length)) * 100),
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 3); // Take top 3 traits

    // Normalize percentages if we have few traits causing all to be 100%
    if (traits.length > 1 && traits.every((t) => t.percentage === 100)) {
      // Calculate relative percentages based on count
      const totalCount = traits.reduce((sum, t) => sum + t.count, 0);
      traits.forEach((trait) => {
        trait.percentage = Math.round((trait.count / totalCount) * 100);
      });
    }

    // Ensure minimum percentage for visibility
    traits.forEach((trait) => {
      if (trait.percentage < 10) trait.percentage = 10;
    });

    // Calculate additional metrics
    const totalReviews = reviews.length;
    const credibility = Math.round((positiveCount / totalReviews) * 100);
    const optimism = Math.round(
      ((positiveCount * 2 + neutralCount) / (totalReviews * 2)) * 100
    );
    const reputationScore = Math.round(
      (positiveCount * 5 + neutralCount * 3 + negativeCount * 1) / totalReviews
    );

    res.status(200).json({
      success: true,
      data: {
        traits,
        credibility,
        optimism,
        reputationScore,
      },
    });
  } catch (error) {
    console.error("Error getting trait analytics:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get trait analytics",
      error: error.message,
    });
  }
};
