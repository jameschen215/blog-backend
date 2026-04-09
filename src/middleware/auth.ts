import passport from 'passport';
import { RequestHandler } from 'express';
import { Role } from '../generated/prisma/client';

// export const requireLogin: RequestHandler = (req, res, next) => {
//   console.log('🍪 Cookies:', req.cookies); // ← Add this
//   console.log('🔑 JWT Cookie:', req.cookies.jwt); // ← Add this

//   passport.authenticate(
//     'jwt',
//     { session: false },
//     (err: Error | null, user: Express.User | false) => {
//       console.log('👤 Authenticated user:', user); // ← Add this
//       console.log('❌ Error:', err); // ← Add this

//       if (err) return next(err);

//       if (!user) {
//         return res.status(401).json({
//           message: 'Authentication required',
//         });
//       }

//       req.user = user;

//       next();
//     }
//   )(req, res, next);
// };
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

// Role-based authorization
export const requireRole = (...roles: Role[]): RequestHandler => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        message: 'Insufficient permissions',
      });
    }

    next();
  };
};
