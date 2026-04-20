import mongoose from "mongoose";

const connectDb = async () => {
  try {
    if (mongoose.connection.readyState >= 1) {
      console.log("MongoDB already connected");
    }
    const uri = process.env.MONGODB_URI;
    if (!uri) {
      throw new Error("URI not found in env file");
    }
    await mongoose.connect(uri);
    console.log("MongoDB connected successfully");
  } catch (error) {
    console.error("MongoDB connection failed");
    throw new Error("MongoDB connection failed");
  }
};

export default connectDb;
