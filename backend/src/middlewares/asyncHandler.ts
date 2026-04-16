import { RequestHandler } from 'express';

export const asyncHandler = (fn: RequestHandler): RequestHandler => {
  return (req, res, next) => {
    Promise.resolve((fn as any)(req, res, next)).catch(next);
  };
};
