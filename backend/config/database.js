import mongoose from "mongoose";
import process from "node:process";


const connectDB = async () => {
  try {
    const conn = await mongoose.connect(
      process.env.MONGO_URI || "mongodb://localhost:27017/sweetslice",
    );

    // Ensure reviews collection exists for visible moderation table in Compass.
    await mongoose.connection.createCollection('reviews').catch((error) => {
      if (error?.codeName !== 'NamespaceExists') {
        throw error;
      }
    });

    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error("Error connecting to MongoDB:", error.message);
    process.exit(1);
  }
};


export default connectDB;
