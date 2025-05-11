import mongoose from "mongoose";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import User from "./models/user.model.js";
import Connection from "./models/connection.model.js";
import Review from "./models/review.model.js";
import { createRequire } from "module";

// For ES modules to use process
const require = createRequire(import.meta.url);
const process = require("process");

// Load environment variables
dotenv.config();

// Function to test database connection and basic operations
async function testDBConnection() {
  try {
    console.log("Starting MongoDB connection test...");

    // Connect to MongoDB
    await connectDB();
    console.log("MongoDB connection successful!");

    // Clean up any existing test data first
    console.log("Cleaning up any existing test data...");
    await User.deleteMany({
      username: { $in: ["testuser1", "testuser2", "mutualfriend"] },
    });
    console.log("Existing test data cleaned up");

    // Create test users with random phone numbers to avoid duplicates
    console.log("Creating test users...");
    // Generate random numbers for phone numbers to avoid duplicates
    const randomNum1 = Math.floor(Math.random() * 10000000000).toString().padStart(10, '0');
    const randomNum2 = Math.floor(Math.random() * 10000000000).toString().padStart(10, '0');
    const randomNum3 = Math.floor(Math.random() * 10000000000).toString().padStart(10, '0');
    
    const testUser1 = new User({
      username: "testuser1",
      email: "test1@example.com",
      password: "password123",
      phoneNumber: "+1 " + randomNum1,
      bio: "This is a test user for Credily",
    });

    const testUser2 = new User({
      username: "testuser2",
      email: "test2@example.com",
      password: "password123",
      phoneNumber: "+1 " + randomNum2,
      bio: "This is another test user for Credily",
    });

    // Create a mutual connection user
    const testUser3 = new User({
      username: "mutualfriend",
      email: "mutual@example.com",
      password: "password123",
      phoneNumber: "+1 " + randomNum3,
      bio: "This is a mutual friend for testing",
    });

    // Save test users
    const savedUser1 = await testUser1.save();
    const savedUser2 = await testUser2.save();
    const savedUser3 = await testUser3.save();

    console.log("Test users created successfully!");
    console.log(`User 1 ID: ${savedUser1._id}`);
    console.log(`User 2 ID: ${savedUser2._id}`);
    console.log(`Mutual Friend ID: ${savedUser3._id}`);

    // Create connections between users to create a mutual connection scenario
    console.log("Creating test connections...");

    // Connection between user1 and mutual friend
    const connection1 = new Connection({
      requester: savedUser1._id,
      recipient: savedUser3._id,
      status: "accepted",
    });

    // Connection between user2 and mutual friend
    const connection2 = new Connection({
      requester: savedUser2._id,
      recipient: savedUser3._id,
      status: "accepted",
    });

    // Direct connection between user1 and user2
    const connection3 = new Connection({
      requester: savedUser1._id,
      recipient: savedUser2._id,
      status: "accepted",
    });

    await connection1.save();
    await connection2.save();

    console.log("Test connections created successfully!");

    // Verify connection functionality
    const areMutual = await Connection.areConnected(
      savedUser1._id,
      savedUser2._id
    );
    console.log(`Are users directly connected? ${areMutual}`);

    const mutualConnections = await Connection.findMutualConnections(
      savedUser1._id,
      savedUser2._id
    );
    console.log(
      `Number of mutual connections found: ${mutualConnections.length}`
    );
    console.log(`Mutual connections: ${mutualConnections}`);

    // Create a review now that we have mutual connections
    console.log("Creating test review...");
    const testReview = new Review({
      reviewer: savedUser1._id,
      reviewee: savedUser2._id,
      content: "This is a test review for Credily platform",
      rating: 4,
      categories: ["trustworthiness", "communication"],
      sentiment: "positive",
    });

    const savedReview = await testReview.save();
    console.log("Test review created successfully!");    // Update reputation score directly in the User model
    console.log("Updating user's reputation score...");
    const user = await User.findById(savedUser2._id);
    user.reputationScore += 10; // For testing, just add 10 points
    await user.save();
    console.log(`Reputation score updated: ${user.reputationScore}`);

    console.log("Database connection test completed successfully!");
  } catch (error) {
    console.error("Error during database testing:", error);
  } finally {
    // Close the database connection
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
      console.log("MongoDB connection closed");
    }
    process.exit();
  }
}

// Run the test
testDBConnection();
