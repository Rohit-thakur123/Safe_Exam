import { NextFunction, Request, Response } from 'express';
import { timingSafeEqual } from 'crypto';
import { config } from '../config/index.js';

export function requireServiceKey(req: Request, res: Response, next: NextFunction) {
  const provided = req.header('x-compiler-service-key') ?? '';
  const expected = config.serviceKey;
  const valid = provided.length === expected.length &&
    timingSafeEqual(Buffer.from(provided), Buffer.from(expected));

  if (!valid) {
    return res.status(401).json({ status: 'fail', message: 'Unauthorized compiler request' });
  }
  next();
}
