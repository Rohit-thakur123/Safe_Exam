import { Request, Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';
import { executeSubmission } from '../services/compiler.service.js';

export async function runCode(req: Request, res: Response, next: NextFunction) {
  try {
    const { language, code, stdin = '', timeoutSeconds, memoryLimitBytes } = req.body;
    const result = await executeSubmission({ language, code, stdin, timeoutSeconds, memoryLimitBytes });

    res.status(StatusCodes.OK).json({
      status: 'success',
      data: result,
    });
  } catch (error) {
    next(error);
  }
}
