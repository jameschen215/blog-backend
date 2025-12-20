import passport from 'passport';
import { RequestHandler } from 'express';
import { Role } from '../generated/prisma/client';

export const requireLogin: RequestHandler = (req, res, next) => {
  passport.authenticate(
    'jwt',
    { session: false },
    (err: Error | null, user: Express.User | false) => {
      if (err) return next(err);

      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
      }

      req.user = user;

      next();
    }
  )(req, res, next);
};

// Role-based authorization
export const requireRole = (...roles: Role[]): RequestHandler => {
  return (req, res, next) => {
    if (!req.user) {
      return res
        .status(401)
        .json({ success: false, message: 'Authentication required' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions',
      });
    }

    next();
  };
};
