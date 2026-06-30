import { NextFunction, Request, Response } from 'express';
import Joi from 'joi';
import { StatusCodes } from 'http-status-codes';

const runSchema = Joi.object({
  language: Joi.string()
    .valid('python', 'javascript', 'java', 'c', 'cpp')
    .required(),
  code: Joi.string().min(1).required(),
  stdin: Joi.string().allow('').optional(),
});

export function validateRunRequest(req: Request, res: Response, next: NextFunction) {
  const { error } = runSchema.validate(req.body, { abortEarly: false });
  if (error) {
    return res.status(StatusCodes.BAD_REQUEST).json({
      status: 'fail',
      message: 'Invalid request payload',
      details: error.details.map((item) => ({ message: item.message, path: item.path })),
    });
  }
  next();
}
