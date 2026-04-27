const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

let memoryServer;

async function connectDb(mongoUri) {
  try {
    await mongoose.connect(mongoUri);
    console.log('MongoDB connected');
  } catch (error) {
    console.warn('MongoDB connection failed, switching to in-memory MongoDB:', error.message);

    memoryServer = await MongoMemoryServer.create();
    const memoryUri = memoryServer.getUri();
    await mongoose.connect(memoryUri);
    console.log('MongoDB connected (in-memory fallback)');
  }
}

module.exports = connectDb;
