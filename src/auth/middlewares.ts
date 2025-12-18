// import { RequestHandler } from 'express';

// export const isAuthenticated: RequestHandler = (req, res, next) => {
//   if (!req.isAuthenticated()) {
//     return res.status(401).json({ message: 'Unauthorized' });
//   }

//   next();
// };

// export const requireRole = (roles: string[]) => {
//   const func: RequestHandler = (req, res, next) => {
//     if (!req.isAuthenticated()) {
//       return res.status(401).json({ message: 'Authentication required' });
//     }

//     // assuming user has a role property
//     const userRole = req.user.role;

//     if (roles.includes(userRole)) return next();

//     res.status(403).json({ message: 'Insufficient permissions' });
//   };

//   return func;
// };
