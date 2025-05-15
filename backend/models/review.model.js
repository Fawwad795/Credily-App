import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema(
  {
    reviewer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    reviewee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    content: {
      type: String,
      required: [true, "Review content is required"],
      trim: true,
      minlength: 5,
      maxlength: 2000,
    },
    categories: [
      {
        type: String,
        enum: [
          "trustworthiness",
          "communication",
          "reliability",
          "helpfulness",
          "other",
        ],
      },
    ],
    isAnonymous: {
      type: Boolean,
      default: true,
    },
    sentiment: {
      type: String,
      enum: [
        "critically negative",
        "negative",
        "neutral",
        "positive",
        "critically positive",
      ],
      default: "neutral",
    },
    sentimentDetails: {
      score: {
        type: Number,
        default: 0,
      },
      magnitude: {
        type: Number,
        default: 0,
      },
    },
    hasVerifiedConnection: {
      type: Boolean,
      default: false,
    },
    isPublic: {
      type: Boolean,
      default: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster lookups
reviewSchema.index({ reviewer: 1 });
reviewSchema.index({ reviewee: 1 });
reviewSchema.index({ reviewee: 1, rating: -1 });
reviewSchema.index({ createdAt: -1 });

// Pre-save middleware to ensure mutual connections exist
reviewSchema.pre("save", async function (next) {
  try {
    if (this.isNew) {
      // Only check on new review creation
      const Connection = mongoose.model("Connection");

      // Ensure the IDs are proper ObjectId instances
      let reviewerId, revieweeId;
      try {
        reviewerId = new mongoose.Types.ObjectId(this.reviewer);
        revieweeId = new mongoose.Types.ObjectId(this.reviewee);
      } catch (err) {
        return next(new Error("Invalid reviewer or reviewee ID format"));
      }

      // First check if there's a direct connection between the users
      const directConnection = await Connection.findOne({
        $or: [
          {
            requester: reviewerId,
            recipient: revieweeId,
            status: "accepted",
          },
          {
            requester: revieweeId,
            recipient: reviewerId,
            status: "accepted",
          },
        ],
      });

      if (directConnection) {
        // Direct connection exists, so we can allow the review
        this.hasVerifiedConnection = true;
        return next();
      }

      // If no direct connection, check for mutual connections
      const mutualConnections = await Connection.findMutualConnections(
        reviewerId,
        revieweeId
      );

      if (mutualConnections.length > 0) {
        this.hasVerifiedConnection = true;
      } else {
        // If there are no direct or mutual connections, prevent saving the review
        const error = new Error(
          "Reviews can only be written when there is a direct connection or mutual connections"
        );
        return next(error);
      }
    }
    next();
  } catch (error) {
    next(error);
  }
});

// Static method to calculate average rating for a user
reviewSchema.statics.calculateAverageRating = async function (userId) {
  try {
    // Ensure userId is a valid ObjectId
    let userObjectId;
    try {
      userObjectId = new mongoose.Types.ObjectId(userId);
    } catch (err) {
      return 0;
    }

    const result = await this.aggregate([
      { $match: { reviewee: userObjectId, isActive: true } },
      { $group: { _id: "$reviewee", averageRating: { $avg: "$rating" } } },
    ]);

    return result.length > 0 ? result[0].averageRating : 0;
  } catch (error) {
    return 0;
  }
};

const Review = mongoose.model("Review", reviewSchema);

export default Review;
