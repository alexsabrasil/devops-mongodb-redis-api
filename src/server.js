require('dotenv').config();

const mongoose = require('mongoose');
const app = require('./app');
const redisClient = require('./config/redis');

const PORT = process.env.PORT || 3000;

async function startServer() {
  try {
    await mongoose.connect(process.env.MONGO_URL);
    console.log('✅ MongoDB connected');

    await redisClient.connect();
    console.log('✅ Redis connected');

    app.listen(PORT, () => {
      console.log(`🚀 Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error('❌ Server startup error:', error);
    process.exitCode = 1;
  }
}

startServer();
