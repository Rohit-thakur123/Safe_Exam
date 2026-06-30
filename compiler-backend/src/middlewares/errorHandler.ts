import { NextFunction, Request, Response } from 'express';
import { StatusCodes, getReasonPhrase } from 'http-status-codes';

export function errorHandler(err: Error | any, _req: Request, res: Response, _next: NextFunction) {
  const status = err.status ?? StatusCodes.INTERNAL_SERVER_ERROR;
  const message = err.message ?? getReasonPhrase(status);

  res.status(status).json({
    status: 'error',
    message,
    details: err.details ?? undefined,
  });
}
