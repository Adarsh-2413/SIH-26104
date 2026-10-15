const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    // Note: No second object with options passed here
    console.log("THE URL IS:", process.env.MONGO_URI);
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error connecting to MongoDB: ${error}`);
    process.exit(1);
  }
};

module.exports = connectDB;