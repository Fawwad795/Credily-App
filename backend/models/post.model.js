import mongoose from "mongoose";

const commentSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    content: {
      type: String,
      required: [true, "Comment content is required"],
      trim: true,
      maxlength: 1000,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

const postSchema = new mongoose.Schema(
  {
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    caption: {
      type: String,
      required: [true, "Post caption is required"],
      trim: true,
      maxlength: 2000,
    },
    media: [
      {
        type: {
          type: String,
          enum: ["image", "video"],
          required: true,
        },
        url: {
          type: String,
          required: true,
        },
        thumbnail: {
          type: String,
          // Only required for videos
        },
        altText: {
          type: String,
          default: "",
        },
      },
    ],
    likes: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    comments: [commentSchema],
    tags: [String],
    location: {
      type: String,
      trim: true,
    },
    visibility: {
      type: String,
      enum: ["public", "connections", "private"],
      default: "public",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    totalLikes: {
      type: Number,
      default: 0,
    },
    totalComments: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for faster lookups
postSchema.index({ author: 1, createdAt: -1 });
postSchema.index({ "likes.user": 1 });
postSchema.index({ tags: 1 });
postSchema.index({ createdAt: -1 });

// Update like count when a like is added or removed
postSchema.pre("save", function (next) {
  if (this.isModified("likes")) {
    this.totalLikes = this.likes.length;
  }

  if (this.isModified("comments")) {
    this.totalComments = this.comments.length;
  }

  next();
});

// Virtual for simplified likes count
postSchema.virtual("likesCount").get(function () {
  return this.likes.length;
});

// Virtual for simplified comments count
postSchema.virtual("commentsCount").get(function () {
  return this.comments.length;
});

// Method to add a like to a post
postSchema.methods.addLike = function (userId) {
  // Check if user already liked this post
  if (!this.likes.some((like) => like.user.toString() === userId.toString())) {
    this.likes.push({ user: userId });
    this.totalLikes = this.likes.length;
    return true;
  }
  return false;
};

// Method to remove a like from a post
postSchema.methods.removeLike = function (userId) {
  const initialLength = this.likes.length;
  this.likes = this.likes.filter(
    (like) => like.user.toString() !== userId.toString()
  );
  this.totalLikes = this.likes.length;
  return initialLength !== this.likes.length;
};

// Method to add a comment to a post
postSchema.methods.addComment = function (userId, content) {
  const comment = {
    user: userId,
    content: content,
  };
  this.comments.push(comment);
  this.totalComments = this.comments.length;
  return comment;
};

const Post = mongoose.model("Post", postSchema);

export default Post;
