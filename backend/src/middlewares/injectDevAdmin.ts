import { Request, Response, NextFunction } from 'express';

export default function injectDevAdmin() {
  return (req: Request, _res: Response, next: NextFunction) => {
    // If a real auth system already populated req.user, do nothing.
    if ((req as any).user) return next();

    // Inject default dev admin when ASSUME_ADMIN=true or not running in production.
    const assume = process.env.ASSUME_ADMIN === 'true' || process.env.NODE_ENV !== 'production';
    if (!assume) return next();

    (req as any).user = {
      id: process.env.DEV_ADMIN_ID || 'admin:dev',
      email: process.env.DEV_ADMIN_EMAIL || 'admin@example.com',
      name: process.env.DEV_ADMIN_NAME || 'Dev Admin',
      role: 'admin',
    };
    return next();
  };
}
