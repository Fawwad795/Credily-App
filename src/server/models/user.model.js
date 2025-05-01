import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: [true, "Username is required"],
      unique: true,
      trim: true,
      minlength: 3,
      maxlength: 30,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      trim: true,
      lowercase: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        "Please enter a valid email",
      ],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: 6,
      select: false, // Don't include password in query results by default
    },
    phoneNumber: {
      type: String,
      unique: true,
      sparse: true, // Allow null/undefined values to be unique
    },
    profilePicture: {
      type: String,
      default: "default-profile.png",
    },
    bio: {
      type: String,
      maxlength: 300,
    },
    reputationScore: {
      type: Number,
      default: 0,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    location: String,
    createdAt: {
      type: Date,
      default: Date.now,
    },
    lastActive: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Index frequently queried fields
userSchema.index({ username: 1 });
userSchema.index({ email: 1 });
userSchema.index({ phoneNumber: 1 });

// Pre-save middleware to hash password
userSchema.pre("save", async function (next) {
  // Only hash password if it's modified
  if (!this.isModified("password")) {
    return next();
  }

  try {
    // Generate salt and hash password
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare passwords
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model("User", userSchema);

export default User;
