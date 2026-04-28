// config/rate-limit.ts

import rateLimit from 'express-rate-limit';

const isTest = () => process.env.NODE_ENV === 'test';

// General API rate limiter - 1000 requests per 15 minutes
export const generalLimiter = rateLimit({
  windowMs: 1000 * 60 * 15,
  max: 1000,
  message: {
    message: 'Too many requests, please try again later',
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  skip: isTest,
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
  skip: isTest,
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
  skip: isTest,
});

// Post like rate limiter - 5 likes per minute
export const postLikeLimiter = rateLimit({
  windowMs: 1000 * 60,
  max: 5,
  message: {
    message: 'Like the post too often, please try later',
  },
  skip: isTest,
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
  skip: (req) => isTest() || !!req.user, // Skip in test env; authenticated users bypass limit
});
