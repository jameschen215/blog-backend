// config/rate-limit.ts

import rateLimit from 'express-rate-limit';

// General API rate limiter - 100 requests per 15 minutes
export const generalLimiter = rateLimit({
  windowMs: 1000 * 60 * 15,
  max: 100,
  message: {
    message: 'Too many requests, please try again later',
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

// Strict limiter for auth routes - 5 requests per 15 minutes
export const authLimiter = rateLimit({
  windowMs: 1000 * 60 * 15,
  max: 5,
  message: {
    message: 'Too many authentication attempts, please try again later',
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Only count failed requests
});

// Post creation rate limiter - 5 posts per hour
export const postLimiter = rateLimit({
  windowMs: 1000 * 60 * 60,
  max: 5,
  message: {
    message: 'Too many posts created, please try again later',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Comment creation rate limiter - 10 comments per hour
export const commentLimiter = rateLimit({
  windowMs: 1000 * 60 * 60,
  max: 10,
  message: {
    message: 'Too many comments, please try again later',
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Skip rate limit for authenticated users
  skip: (req) => !!req.user, // Authenticated users bypass limit
});
