import { ErrorRequestHandler } from 'express';
import { AppError, DuplicateTransactionError } from '../errors';
import { logger } from '../config/logger';

export const errorHandler: ErrorRequestHandler = (err, req, res, _next) => {
  let e: AppError;

  if (err instanceof AppError) e = err;
  else if (err?.type === 'entity.parse.failed')
    e = new AppError(400, 'INVALID_JSON', 'Request body is not valid JSON');
  else if (err?.code === '23505') e = new DuplicateTransactionError();      // unique violation backstop
  else if (err?.code === '23514')
    e = new AppError(422, 'CONSTRAINT_VIOLATION', 'Data violates a database constraint'); // CHECK backstop
  else {
    logger.error({ err, requestId: res.locals.requestId }, 'Unhandled error');
    e = new AppError(500, 'INTERNAL_ERROR', 'Something went wrong');
  }

  res.status(e.status).json({
    error: {
      code: e.code,
      message: e.message,
      details: e.details,
      request_id: res.locals.requestId,
    },
  });
};