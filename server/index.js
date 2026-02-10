import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet';
import mongoose from 'mongoose';
import path from 'path'; // For resolving file paths

// Import Routes
import authRoutes from './routes/auth.js';
import staffRoutes from './routes/staff.js';
import adminRoutes from './routes/admin.js';
import userRoutes from './routes/user.js';

const app = express();
dotenv.config();

// CORS Configuration - Production and Development URLs
const allowedOrigins = [
  'https://railsahayta.neuramaps.in',
  'http://localhost:5173',
  'http://localhost:3000'
];

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1 || process.env.CLIENT_URL?.split(',').includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200
};

// Middleware
app.use(express.json());
app.use(helmet());
app.use(cors(corsOptions));

// Serve static files from the "uploads" directory
app.use('/user/media', express.static('uploads'));

// MongoDB Connection
const PORT = process.env.PORT || 3001;

mongoose
  .connect(process.env.MONGODB_URL, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    app.listen(PORT, () => console.log(`Server is running on port: ${PORT}`));
  })
  .catch((error) => {
    console.error(`MongoDB connection error: ${error.message}`);
  });

// Routes
app.use('/auth', authRoutes);
app.use('/user', userRoutes);
app.use('/staff', staffRoutes);
app.use('/admin', adminRoutes);

// Test Route
app.get('/hello', (req, res) => {
  res.status(200).json({ message: 'Hello, world!' });
});
