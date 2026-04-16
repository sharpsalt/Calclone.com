import { Request, Response, NextFunction } from 'express';
import { randomUUID as uuidv4 } from 'crypto';

export const requestIdMiddleware = (req: Request, _res: Response, next: NextFunction) => {
  const incoming = (req.headers['x-request-id'] as string) || (req.headers['x-correlation-id'] as string);
  req.requestId = incoming || uuidv4();
  // set header so downstream services and logs can use it
  (_res as Response).setHeader('X-Request-ID', req.requestId);
  next();
};

export default requestIdMiddleware;
