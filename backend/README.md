Calclone Backend
================

This backend is intentionally scoped to the assignment's core requirements.

Scope
-----

- Event types CRUD with unique slug
- Availability settings with weekday time ranges and timezone
- Public slot computation and booking creation
- Double-booking prevention at database level
- Cache-first public reads for slug and slots endpoints
- Redis-backed cache when REDIS_URL is configured (in-memory fallback otherwise)
- Idempotent booking create retries using Idempotency-Key header
- Queue-backed booking confirmation jobs (BullMQ) with retry/backoff
- Audit logs for booking and event type mutations
- Bookings dashboard endpoints (upcoming, past, all, cancel)

Tech Stack
----------

- Node.js + Express + TypeScript
- PostgreSQL
- Redis (optional but recommended for cache + queue)
- Zod for request validation

Run Locally (PostgreSQL)
------------------------

1. Copy env file:

   cp .env.example .env

2. Start Postgres + API:

   docker-compose up -d --build

3. Apply schema and seed sample data:

   npm run migrate
   npm run seed

API Endpoints
-------------

- GET /health
- GET /api/health

- GET /api/event-types
- GET /api/event-types/slug/:slug
- GET /api/event-types/public/:username
- POST /api/event-types
- PUT /api/event-types/:id
- DELETE /api/event-types/:id

- GET /api/availability
- POST /api/availability
- GET /api/availability/schedules
- POST /api/availability/schedules
- GET /api/availability/schedules/:id
- PUT /api/availability/schedules/:id

- GET /api/bookings/slots?event_type_id=<uuid>&date=YYYY-MM-DD
- GET /api/bookings?status=upcoming|unconfirmed|recurring|past|all|cancelled&page=1&page_size=10
- POST /api/bookings
- GET /api/bookings/:id
- DELETE /api/bookings/:id

Versioned API aliases:

- /api/v1/event-types/*
- /api/v1/bookings/*
- /api/admin/v1/event-types/*
- /api/admin/v1/availability/*
- /api/admin/v1/bookings/*

High-Traffic Notes
------------------

- Public reads (`/api/event-types/slug/:slug`, `/api/event-types/public/:username`, `/api/bookings/slots`) use cache with stale-while-revalidate semantics.
- If `REDIS_URL` is configured, cache state is shared via Redis and can be reused across app instances.
- Public endpoints emit edge-friendly cache headers (`s-maxage`, `stale-while-revalidate`) for CDN reuse.
- Bookings list endpoint uses server-side pagination + DB filtering to keep browser memory usage stable with large datasets.
- Schema includes indexes for status/date/event_type filters to reduce scan pressure on large booking tables.
- Send `Idempotency-Key` header on `POST /api/bookings` to safely retry requests without creating duplicate bookings.
   - The server also accepts `X-Request-Id` and `X-Idempotency-Key` as idempotency identifiers.
   - We expose a short alias `POST /api/book` which behaves identically to `POST /api/bookings`.
  
- Connection pooling / PgBouncer:
   - For high connection counts, run a PgBouncer instance and point `DATABASE_URL` at PgBouncer.
   - Tune the app pool via `DB_POOL_MAX` (default: 200). Example reasonable defaults are:

      - `DB_POOL_MAX=200`
      - `DB_IDLE_TIMEOUT_MS=30000`
      - `DB_CONNECTION_TIMEOUT_MS=2000`

   - PgBouncer should be configured in `transaction` pooling mode for best compatibility. Avoid using server-side session features (temporary tables, prepared statements that rely on session state) when running behind PgBouncer.

   - Example PgBouncer `pgbouncer.ini` minimal settings:

      [databases]
      calclone = host=postgres port=5432 dbname=calclone

      [pgbouncer]
      listen_addr = *
      listen_port = 6432
      auth_type = md5
      pool_mode = transaction
      default_pool_size = 200
      reserve_pool_size = 20
      server_reset_query = DISCARD ALL

- Booking writes still rely on database constraints/transactions for strict slot correctness.
- Public read and booking create endpoints have built-in per-IP rate limits.
- Start the async email worker with `npm run worker:emails`.

Email delivery (async)
----------------------

- The API performs the minimum viable write during the HTTP request: it INSERTs the booking row and enqueues a background job to send confirmation email. The response is returned immediately — the user never waits for the email provider.
- We use BullMQ (Redis) as the job queue. To run the worker that sends emails, start:

   ```bash
   cd backend
   npm run worker:emails
   ```

- The API enqueues `{ bookingId, emailType: 'confirmation' }` and the worker will pick it up and call Resend or SendGrid. If the email provider is down, the job will retry in the background; the booking request still succeeded.

Notes
-----

- No login/auth is required for this assignment build.
- Admin endpoints assume a default user from DEFAULT_USERNAME.
- Database uniqueness on (event_type_id, date, start_time) protects against duplicate bookings.
