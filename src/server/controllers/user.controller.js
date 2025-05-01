import User from "../models/user.model.js";

// Register a new user
export const registerUser = async (req, res) => {
  try {
    const { username, email, password, phoneNumber } = req.body;

    // Check if username already exists
    const userExists = await User.findOne({ username });
    if (userExists) {
      return res.status(400).json({
        success: false,
        message: "Username is already taken",
      });
    }

    // Check if email already exists
    const emailExists = await User.findOne({ email });
    if (emailExists) {
      return res.status(400).json({
        success: false,
        message: "Email is already registered",
      });
    }

    // Create new user
    const user = await User.create({
      username,
      email,
      password,
      phoneNumber,
    });

    // Return user data without password
    const userData = {
      _id: user._id,
      username: user.username,
      email: user.email,
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
        message: "Invalid credentials",
      });
    }

    // Check if password is correct
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    // Return user data without password
    const userData = {
      _id: user._id,
      username: user.username,
      email: user.email,
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
