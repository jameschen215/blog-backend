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

// “this function checks at runtime whether schema is a Zod schema,
// and if it is, TypeScript may treat it as that type afterward.”
function isZodSchema(schema: ZodType | RequestSchemas): schema is ZodType {
  return (
    typeof schema === 'object' && schema !== null && 'parseAsync' in schema
  );
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

export const validate = (schema: ZodType | RequestSchemas): RequestHandler => {
  const schemas = isZodSchema(schema) ? { body: schema } : schema;

  return async (req, res, next) => {
    // Create a writable request alias
    // This is the TypeScript workaround that lets the middleware write parsed values back onto:
    // - req.body
    // - req.params
    // - req.query
    const mutableReq = req as MutableRequest;

    // If req.validated is null/undefined, initialize it as {}
    // ??= is the nullish coalescing assignment operator
    req.validated ??= {};

    try {
      if (schemas.body) {
        const body = await schemas.body.parseAsync(req.body);

        // - req.body gives downstream code the normalized runtime value directly
        // - req.validated.body keeps a separate record of “this came from validation”
        mutableReq.body = body;
        req.validated.body = body;
      }

      if (schemas.params) {
        // Treat this parsed value as the same type as req.params
        const params = (await schemas.params.parseAsync(
          req.params
        )) as Request['params'];
        mutableReq.params = params;
        req.validated.params = params;
      }

      if (schemas.query) {
        const query = (await schemas.query.parseAsync(
          req.query
        )) as Request['query'];
        mutableReq.query = query;
        req.validated.query = query;
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
