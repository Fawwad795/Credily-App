import mongoose from "mongoose";

const reputationScoreSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    overallScore: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    categoryScores: {
      trustworthiness: {
        type: Number,
        default: 0,
        min: 0,
        max: 100,
      },
      communication: {
        type: Number,
        default: 0,
        min: 0,
        max: 100,
      },
      reliability: {
        type: Number,
        default: 0,
        min: 0,
        max: 100,
      },
      helpfulness: {
        type: Number,
        default: 0,
        min: 0,
        max: 100,
      },
    },
    reviewCount: {
      type: Number,
      default: 0,
    },
    positiveReviewCount: {
      type: Number,
      default: 0,
    },
    negativeReviewCount: {
      type: Number,
      default: 0,
    },
    lastUpdated: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Index for quick lookups
reputationScoreSchema.index({ user: 1 });
reputationScoreSchema.index({ overallScore: -1 });

// Static method to recalculate reputation score based on reviews
reputationScoreSchema.statics.recalculateScore = async function (userId) {
  try {
    // Get the Review model
    const Review = mongoose.model("Review");

    // Get all active reviews for the user
    const reviews = await Review.find({
      reviewee: userId,
      isActive: true,
    });

    // Count reviews by sentiment
    const positiveReviews = reviews.filter(
      (r) => r.sentiment === "positive"
    ).length;
    const negativeReviews = reviews.filter(
      (r) => r.sentiment === "negative"
    ).length;
    const totalReviews = reviews.length;

    // Calculate category scores
    const categoryScores = {
      trustworthiness: 0,
      communication: 0,
      reliability: 0,
      helpfulness: 0,
    };

    // Initialize counters for each category
    const categoryCounts = {
      trustworthiness: 0,
      communication: 0,
      reliability: 0,
      helpfulness: 0,
    };

    // Sum up ratings by category
    reviews.forEach((review) => {
      review.categories.forEach((category) => {
        if (Object.prototype.hasOwnProperty.call(categoryScores, category)) {
          categoryScores[category] += review.rating;
          categoryCounts[category]++;
        }
      });
    });

    // Calculate average score for each category
    for (const category in categoryScores) {
      if (categoryCounts[category] > 0) {
        categoryScores[category] =
          (categoryScores[category] / categoryCounts[category]) * 20; // Convert 5-star rating to 100-scale
      }
    }

    // Calculate overall score (weighted average of all category scores)
    let overallScore = 0;
    let weightSum = 0;

    for (const category in categoryScores) {
      if (categoryCounts[category] > 0) {
        overallScore += categoryScores[category] * categoryCounts[category];
        weightSum += categoryCounts[category];
      }
    }

    if (weightSum > 0) {
      overallScore = overallScore / weightSum;
    } else {
      overallScore = 0;
    }

    // Update or create reputation score document
    const reputationScore = await this.findOneAndUpdate(
      { user: userId },
      {
        $set: {
          overallScore,
          categoryScores,
          reviewCount: totalReviews,
          positiveReviewCount: positiveReviews,
          negativeReviewCount: negativeReviews,
          lastUpdated: Date.now(),
        },
      },
      { new: true, upsert: true }
    );

    // Also update the user document with the overall score
    await mongoose
      .model("User")
      .findByIdAndUpdate(userId, { $set: { reputationScore: overallScore } });

    return reputationScore;
  } catch (error) {
    console.error("Error recalculating reputation score:", error);
    throw error;
  }
};

const ReputationScore = mongoose.model(
  "ReputationScore",
  reputationScoreSchema
);

export default ReputationScore;
