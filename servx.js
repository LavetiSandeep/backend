const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const {MongoClient} = require("mongodb")

dotenv.config();

const app = express();
const PORT = 5000;

// Async function to connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("MongoDB Connected Successfully");
  } catch (error) {
    console.error("MongoDB Connection Error:", error);
    process.exit(1); // Exit process with failure
  }
};

// Call the database connection function
module.exports = connectDB;
