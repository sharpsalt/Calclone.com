import { Request, Response, NextFunction } from 'express';
import ApiError from '../errors/ApiError';

export default function errorHandler(err: any, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof ApiError) {
    console.warn(`[${err.status}] ${err.message} — ${_req.method} ${_req.originalUrl}`);
    return res.status(err.status).json({
      error: err.message,
      code: err.code,
      details: err.details,
    });
  }

  console.error('Unhandled error:', err?.message || err, _req.method, _req.originalUrl);

  res.status(500).json({ error: 'Internal server error' });
}
