import type { NextFunction, Request, Response } from 'express';
import type { ZodTypeAny } from 'zod';
import ApiError from '../errors/ApiError';

export function validateBody(schema: ZodTypeAny) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      const message = parsed.error.issues
        .map((issue) => `${issue.path.join('.') || 'body'}: ${issue.message}`)
        .join('; ');
      return next(ApiError.badRequest(message));
    }

    req.body = parsed.data;
    return next();
  };
}
