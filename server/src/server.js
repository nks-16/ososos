// server/src/server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const { connectDB } = require('./config/db');

const authRoutes = require('./routes/auth');
const cmdRoutes = require('./routes/commands');
const adminRoutes = require('./routes/admin');

const app = express();
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

const limiter = rateLimit({
  windowMs: 1000,
  max: 10,
  message: 'Too many requests'
});
app.use('/api/commands', limiter);

app.use('/api/auth', authRoutes);
app.use('/api/commands', cmdRoutes);
app.use('/api/admin', adminRoutes);

const PORT = process.env.PORT || 4000;

(async () => {
  const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/oscape';
  await connectDB(mongoUri);
  app.listen(PORT, () => console.log(`Server running on ${PORT}`));
})();
