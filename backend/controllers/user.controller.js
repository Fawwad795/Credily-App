import User from "../models/user.model.js";

// Register a new user
export const registerUser = async (req, res) => {
  try {
    const { phoneNumber, password } = req.body;

    if (!phoneNumber || !password) {
      return res.status(400).json({
        success: false,
        message: "Phone number and password are required",
      });
    }

    // Check if phone number already exists
    const phoneExists = await User.findOne({ phoneNumber });
    if (phoneExists) {
      return res.status(400).json({
        success: false,
        message: "Phone number is already registered",
      });
    }

    // Generate a username based on phone number (just for initial account creation)
    const username = `user_${Date.now().toString().slice(-6)}`;

    // Create new user without requiring email
    const user = await User.create({
      username,
      // No email field - it's optional now
      password,
      phoneNumber,
    });

    // Return user data without password
    const userData = {
      _id: user._id,
      username: user.username,
      phoneNumber: user.phoneNumber,
      isVerified: user.isVerified,
    };

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      data: userData,
    });
  } catch (error) {
    console.error("Error registering user:", error);
    res.status(500).json({
      success: false,
      message: "Registration failed",
      error: error.message,
    });
  }
};

// Login user
export const loginUser = async (req, res) => {
  try {
    const { phoneNumber, password } = req.body;

    // Check if user exists
    const user = await User.findOne({ phoneNumber }).select("+password");
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Account does not exist",
        error: "no_account",
      });
    }

    // Check if password is correct
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Password incorrect",
        error: "invalid_password",
      });
    }

    // Return user data without password
    const userData = {
      _id: user._id,
      username: user.username,
      phoneNumber: user.phoneNumber,
      isVerified: user.isVerified,
    };

    res.status(200).json({
      success: true,
      message: "Login successful",
      data: userData,
    });
  } catch (error) {
    console.error("Error logging in:", error);
    res.status(500).json({
      success: false,
      message: "Login failed",
      error: error.message,
    });
  }
};

// Signout user
export const signoutUser = async (req, res) => {
  try {
    // Clear any authentication tokens or cookies
    res.clearCookie("token"); // Assuming you're using cookies for authentication
    res.status(200).json({
      success: true,
      message: "User signed out successfully",
    });
  } catch (error) {
    console.error("Error signing out user:", error);
    res.status(500).json({
      success: false,
      message: "Signout failed",
      error: error.message,
    });
  }
};
