import { RequestHandler } from 'express';
import { ZodTypeAny } from 'zod';
import { ValidationError } from '../errors';

type Schemas = { params?: ZodTypeAny; query?: ZodTypeAny; body?: ZodTypeAny };

export const validate = (schemas: Schemas): RequestHandler => (req, res, next) => {
  const issues: { field: string; issue: string }[] = [];
  const valid: Record<string, any> = {};

  for (const key of ['params', 'query', 'body'] as const) {
    const schema = schemas[key];
    if (!schema) continue;
    const result = schema.safeParse(req[key]);
    if (result.success) valid[key] = result.data;
    else
      issues.push(
        ...result.error.issues.map((i) => ({
          field: [key, ...i.path].join('.'),
          issue: i.message,
        })),
      );
  }

  if (issues.length) return next(new ValidationError(issues));
  res.locals.valid = valid; // Express 5: req.query is read-only, so keep parsed data here
  next();
};