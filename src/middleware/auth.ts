import passport from 'passport';
import { RequestHandler } from 'express';

export const requireLogin: RequestHandler = (req, res, next) => {
  passport.authenticate(
    'jwt',
    { session: false },
    (err: Error | null, user: Express.User | false) => {
      if (err) return next(err);

      if (!user) {
        return res.status(401).json({
          message: 'Authentication required',
        });
      }

      req.user = user;

      next();
    }
  )(req, res, next);
};

// Optional authentication
export const optionalAuth: RequestHandler = (req, res, next) => {
  passport.authenticate(
    'jwt',
    { session: false },
    (err: Error | null, user: Express.User | false) => {
      if (err) return next(err);

      // Set user if valid token exists, otherwise continue without user
      if (user) {
        req.user = user;
      }

      next(); // Always continue, even without user
    }
  )(req, res, next);
};
