import { Request, RequestHandler } from 'express';
import { ZodError, ZodType } from 'zod';

type RequestSchemas = {
  body?: ZodType;
  params?: ZodType;
  query?: ZodType;
};

type MutableRequest = Request & {
  body: unknown;
  params: unknown;
  query: unknown;
};

function isZodSchema(schema: ZodType | RequestSchemas): schema is ZodType {
  return typeof (schema as ZodType).safeParseAsync === 'function';
}

function formatValidationError(error: ZodError) {
  return {
    message: 'Validation error',
    errors: error.issues.map((issue) => ({
      field: issue.path.join('.'),
      message: issue.message,
    })),
  };
}

export const validate = (
  schema: ZodType | RequestSchemas
): RequestHandler => {
  const schemas = isZodSchema(schema) ? { body: schema } : schema;

  return async (req, res, next) => {
    const mutableReq = req as MutableRequest;
    req.validated ??= {};

    try {
      if (schemas.body) {
        const body = await schemas.body.parseAsync(req.body);
        mutableReq.body = body;
        req.validated.body = body;
      }

      if (schemas.params) {
        const params = (await schemas.params.parseAsync(
          req.params
        )) as Request['params'];
        mutableReq.params = params;
        req.validated.params = params;
      }

      if (schemas.query) {
        req.validated.query = (await schemas.query.parseAsync(
          req.query
        )) as Request['query'];
      }

      next();
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json(formatValidationError(error));
      }

      next(error);
    }
  };
};
