import { ZodError } from 'zod';
import { ErrorRequestHandler } from 'express';
import { Prisma } from '../generated/prisma/client';
import { APIError } from '../lib/api-error';

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  // 1. Prisma errors
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    // Unique constraint violation
    if (err.code === 'P2002') {
      const field = (err.meta?.target as string[])?.[0] || 'field';

      return res.status(409).json({
        message: `${field.charAt(0).toUpperCase() + field.slice(1)} already exists`,
      });
    }

    // Record not found
    if (err.code === 'P2025') {
      return res.status(404).json({
        message: 'Record not found',
      });
    }

    // Foreign key constraint failed
    if (err.code === 'P2003') {
      return res.status(400).json({
        message: 'Invalid reference to related record',
      });
    }

    // Generic Prisma error
    return res.status(400).json({
      message: 'Database operation failed',
    });
  }

  // 2. Prisma validation errors
  if (err instanceof Prisma.PrismaClientValidationError) {
    return res.status(400).json({
      message: 'Invalid data provided',
    });
  }

  // 3. Zod validation errors (shouldn't reach here if using validate middleware, but just in case)
  if (err instanceof ZodError) {
    return res.status(400).json({
      message: 'Validation error',
      errors: err.issues.map((e) => ({
        field: e.path.join('.'),
        message: e.message,
      })),
      // errors: z.flattenError(err),
    });
  }

  // 4. JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      message: 'Invalid token',
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      message: 'Token expired',
    });
  }

  // 5. API errors
  if (err instanceof APIError) {
    return res.status(err.status ?? 500).json({
      message: err.message,
      ...(err.fieldErrors && { errors: err.fieldErrors }),
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    });
  }

  // 5. Default error
  const statusCode = err.status ?? err.statusCode ?? 500;
  const message = err.message || 'Internal server error';

  res.status(statusCode).json({
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};
