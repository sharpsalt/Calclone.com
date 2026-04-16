import express from 'express';
import path from 'path';
import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import requestIdMiddleware from './middlewares/requestId';
import morgan from 'morgan';
import errorHandler from './middlewares/errorHandler';
import eventTypesRouter from './routes/eventTypes';
import availabilityRouter from './routes/availability';
import bookingsRouter from './routes/bookings';
import usersRouter from './routes/users';
import adminBookingsRouter from './routes/adminBookings';
import injectDevAdmin from './middlewares/injectDevAdmin';
import publicBookingsRouter from './routes/publicBookings';
import redisRateLimit from './middlewares/redisRateLimit';
import featureFlagsRouter from './routes/featureFlags';
import { validateBody } from './middlewares/validateBody';
import { createBookingSchema } from './validators/bookings';
import { asyncHandler } from './middlewares/asyncHandler';
import * as bookingsController from './controllers/bookingsController';
import { query } from './db';
import redis from './lib/redis';

dotenv.config();
const SERVER_START = new Date().toISOString();

const app = express();
app.disable('x-powered-by');

// Middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", 'https://apis.google.com'],
      connectSrc: ["'self'"],
      imgSrc: ["'self'", 'data:'],
    },
  },
}));
app.use(requestIdMiddleware);

// Rate limit public GET endpoints to mitigate abuse (basic in-memory limiter)
const publicLimiter = rateLimit({ windowMs: 60_000, max: 60, standardHeaders: true, legacyHeaders: false });
// apply limiter only for GET requests under /api/event-types
app.use('/api/event-types', (req, res, next) => {
  if (req.method === 'GET') return publicLimiter(req, res, next as any);
  return next();
});
app.use(cors({
  origin: process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(',').map((x) => x.trim())
    : ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175'],
  credentials: true,
}));
app.use(morgan('dev'));
app.use(express.json({ limit: '1mb' }));

// Serve uploaded avatars
app.use('/uploads/avatars', express.static(path.resolve(__dirname, '..', 'uploads', 'avatars')));

// Health check
app.get('/api/health', async (_req, res) => {
  try {
    await query('SELECT 1');
    if (redis) {
      try {
        await redis.ping();
      } catch (e) {
        // Redis might be down; still return partial health
        return res.status(500).json({ ok: false, error: 'redis unreachable' });
      }
    }
    res.json({ ok: true, status: 'healthy' });
  } catch (err: any) {
    res.status(500).json({ ok: false, error: err?.message || 'database unreachable' });
  }
});

// Server info: exposes server start timestamp so clients can detect a new server boot
app.get('/api/server-info', (_req, res) => {
  res.json({ server_start: SERVER_START });
});

// API routes
app.use('/api/event-types', eventTypesRouter);
app.use('/api/availability', availabilityRouter);
app.use('/api/bookings', bookingsRouter);
app.use('/api/users', usersRouter);
// Feature flags endpoint for frontend to fetch toggles
app.use('/api/feature-flags', featureFlagsRouter);

// Public tokenized booking management (ICS, cancel, reschedule) — accessible without login
app.use('/api/public', publicBookingsRouter);

// Admin bookings API (assumes admin is already authenticated).
// Admin routes: inject a dev admin in non-production or when ASSUME_ADMIN=true.
app.use('/api/admin/v1/bookings', injectDevAdmin(), adminBookingsRouter);

// Compatibility alias: some clients use `/api/book` as a short path.
app.post('/api/book', redisRateLimit({ windowMs: 60_000, max: 20, keyPrefix: 'bookings:create' }), validateBody(createBookingSchema), asyncHandler(bookingsController.create));

// Global error handler
app.use(errorHandler);

export default app;
