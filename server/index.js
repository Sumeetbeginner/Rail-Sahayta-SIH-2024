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

// Middleware
app.use(express.json());
app.use(helmet());
app.use(cors());

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
