import mongoose from "mongoose";
import dotenv from "dotenv";
import { createRequire } from "module";

// For ES modules to use process
const require = createRequire(import.meta.url);
const process = require("process");

// Load environment variables
dotenv.config();

// Connect to MongoDB
const connectDB = async () => {
  try {
    // Ensure the URI uses the Credily database
    let uri = process.env.MONGODB_URI;
    if (!uri.includes("Credily")) {
      // Add the Credily database name to the URI if it's not already there
      uri = uri.includes("?")
        ? uri.replace("?", "/Credily?")
        : `${uri}/Credily`;
    }

    // Connect without deprecated options
    const conn = await mongoose.connect(uri);
    console.log(
      `MongoDB Connected: ${conn.connection.host} (Database: ${conn.connection.name})`
    );
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
