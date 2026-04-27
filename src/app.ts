import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import passport from 'passport';
import cookieParser from 'cookie-parser';

import authRoutes from './routes/auth.routes';
import identityRoutes from './routes/identity.routes';
import postRoutes from './routes/post.routes';
import { jwtStrategy } from './config/passport.config';
import { errorHandler } from './middleware/error-handler';
import { generalLimiter } from './config/rate-limit.config';

const app = express();

const allowedOrigins = ['http://localhost:5173', process.env.CLIENT_URL];

// Middleware
app.use(cookieParser());
app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
  })
);
app.use(helmet());
app.use(morgan('dev'));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Health check
app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Apply general rate limiter to all routes
app.use('/api', generalLimiter);

// Passport configuration
passport.use(jwtStrategy);
app.use(passport.initialize());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api', identityRoutes);
app.use('/api/posts', postRoutes);

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Global error handler
app.use(errorHandler);

export default app;
