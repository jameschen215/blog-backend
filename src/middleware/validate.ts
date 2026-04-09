import { RequestHandler } from 'express';
import { ZodError, ZodType } from 'zod';

export const validate = (schema: ZodType): RequestHandler => {
  return async (req, res, next) => {
    try {
      await schema.parseAsync(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        console.log(error.issues);

        return res.status(400).json({
          message: 'Validation error',
          errors: error.issues.map((err) => ({
            field: err.path.join('.'),
            message: err.message,
          })),
        });
      }

      next(error);
    }
  };
};
