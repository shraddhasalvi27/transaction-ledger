import { randomUUID } from 'crypto';
import { RequestHandler } from 'express';

export const requestId: RequestHandler = (req, res, next) => {
  const id = (req.headers['x-request-id'] as string) || randomUUID();
  res.locals.requestId = id;
  res.setHeader('X-Request-Id', id);
  next();
};