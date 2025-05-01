import mongoose from "mongoose";
import dotenv from "dotenv";
import { createRequire } from "module";

// For ES modules to use process
const require = createRequire(import.meta.url);
const process = require("process");

// Load environment variables
dotenv.config();

// MongoDB connection options
const options = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
};

// Connect to MongoDB
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, options);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error(`Error connecting to MongoDB: ${error.message}`);
    process.exit(1);
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
