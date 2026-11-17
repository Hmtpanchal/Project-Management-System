const mongoose = require('mongoose');

/**
 * Connect the application to MongoDB.
 * The URI is read from the environment so local MongoDB, Atlas, or a test
 * instance can be used without changing application code.
 */
async function connectDB(uri = process.env.MONGODB_URI) {
  if (!uri) {
    throw new Error('MONGODB_URI is not configured. Add it to server/.env.');
  }

  mongoose.set('strictQuery', true);

  const connection = await mongoose.connect(uri, {
    serverSelectionTimeoutMS: 10000,
  });

  console.log(`MongoDB connected: ${connection.connection.host}`);
  return connection;
}

async function disconnectDB() {
  await mongoose.disconnect();
}

module.exports = { connectDB, disconnectDB };
