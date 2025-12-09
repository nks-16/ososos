const mongoose = require('mongoose');

async function connectDB(mongoUri) {
  await mongoose.connect(mongoUri, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  });
  console.log('MongoDB connected');
}

module.exports = { connectDB };
