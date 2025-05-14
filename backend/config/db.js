import mongoose from "mongoose";
import dotenv from "dotenv";
import { createRequire } from "module";
import path from "path";
import { fileURLToPath } from "url";

// For ES modules to use __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// For ES modules to use process
const require = createRequire(import.meta.url);
const process = require("process");

// Load environment variables from .env file in the backend directory
dotenv.config({ path: path.resolve(__dirname, "../.env") });

// Connect to MongoDB
const connectDB = async () => {
  try {
    // Check if MONGODB_URI exists
    const uri = process.env.MONGODB_URI;

    if (!uri) {
      throw new Error(
        "MongoDB connection string (MONGODB_URI) is not defined in environment variables"
      );
    }

    // Add database name to URI if needed
    const finalUri = !uri.includes("Credily")
      ? uri.includes("?")
        ? uri.replace("?", "/Credily?")
        : `${uri}/Credily`
      : uri;

    // Connection options
    const options = {
      serverSelectionTimeoutMS: 5000, // Shorter timeout for faster feedback
      socketTimeoutMS: 10000,
      connectTimeoutMS: 10000,
      family: 4, // Force IPv4
      maxPoolSize: 5,
      minPoolSize: 1,
      retryWrites: true,
      retryReads: true,
    };

    // Connect with options
    const conn = await mongoose.connect(finalUri, options);
    console.log(
      `MongoDB Connected: ${conn.connection.host} (Database: ${conn.connection.name})`
    );
    return conn;
  } catch (error) {
    console.error(`Error connecting to MongoDB: ${error.message}`);
    throw error;
  }
};

// Graceful shutdown handling
process.on("SIGINT", async () => {
  try {
    await mongoose.connection.close();
    console.log("MongoDB connection closed through app termination");
    process.exit(0);
  } catch (error) {
    console.error(`Error during MongoDB shutdown: ${error.message}`);
    process.exit(1);
  }
});

export default connectDB;
