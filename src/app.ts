import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import passport from 'passport';

import authRoutes from './routes/auth.routes';
import postRoutes from './routes/post.routes';
import { jwtStrategy } from './config/passport.config';
import { errorHandler } from './middleware/error-handler';
import { generalLimiter } from './config/rage-limit.config';

const app = express();

// Middleware
app.use(cors());
app.use(helmet());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Apply general rate limiter to all routes
app.use('/api', generalLimiter);

// Passport configuration
passport.use(jwtStrategy);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/posts', postRoutes);

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Global error handler
app.use(errorHandler);

export default app;
