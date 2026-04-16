# Calclone — Scheduling Platform (Cal.com Clone)

A functional scheduling/booking web application inspired by [Cal.com](https://cal.com). Users can create event types, set availability, and let others book time slots through a public booking page.

## Tech Stack

| Layer      | Technology                              |
|------------|-----------------------------------------|
| Frontend   | React 19 + TypeScript, Vite, TailwindCSS |
| Backend    | Node.js + Express.js + TypeScript       |
| Database   | PostgreSQL                              |
| State Mgmt | Zustand (with localStorage persistence) |
| Validation | Zod (backend request validation)        |
| Routing    | React Router v7                         |
| Icons      | Lucide React                            |

## Features

### Core Features
- **Event Types Management** — Create, edit, delete event types with title, description, duration, and URL slug. Each event type has a unique public booking link.
- **Availability Settings** — Set available days of the week and time ranges (e.g., Mon–Fri, 9 AM – 5 PM). Set timezone for availability schedule.
- **Public Booking Page** — Calendar view for date selection, available time slots based on availability, booking form (name + email), prevents double booking via DB transactions.
- **Bookings Dashboard** — View upcoming/past/cancelled bookings with filtering, cancel bookings, reschedule flow.

### Bonus Features
- Responsive design (mobile, tablet, desktop)
- Multiple availability schedules
- Rescheduling flow for existing bookings
- Buffer time and slot interval settings
- Custom booking questions
- Public user profile page

## Architectural Diagram
- 1st One
  <img width="971" height="812" alt="image" src="https://github.com/user-attachments/assets/c6576ac9-963e-42b8-b9b1-c8c4b9715dda" />


## Database Schema

```
users
├── id (UUID, PK)
├── username (TEXT, UNIQUE)
├── name (TEXT)
├── timezone (TEXT)
└── created_at (TIMESTAMP)

event_types
├── id (UUID, PK)
├── user_id (UUID, FK → users.id)
├── title (TEXT)
├── description (TEXT)
├── duration_minutes (INTEGER)
├── slug (TEXT, UNIQUE)
├── host_name (TEXT)
├── host_timezone (TEXT)
├── settings (JSONB)
├── is_active (BOOLEAN)
├── created_at (TIMESTAMP)
└── updated_at (TIMESTAMP)

availability_schedules
├── id (UUID, PK)
├── user_id (UUID, FK → users.id)
├── name (TEXT)
├── timezone (TEXT)
├── is_default (BOOLEAN)
├── created_at (TIMESTAMP)
└── updated_at (TIMESTAMP)

availability_time_ranges
├── id (UUID, PK)
├── schedule_id (UUID, FK → availability_schedules.id)
├── day_of_week (INTEGER, 0-6)
├── start_time (TIME)
└── end_time (TIME)

bookings
├── id (UUID, PK)
├── event_type_id (UUID, FK → event_types.id)
├── schedule_id (UUID, FK → availability_schedules.id)
├── date (DATE)
├── start_time (TIME)
├── end_time (TIME)
├── booker_name (TEXT)
├── booker_email (TEXT)
├── location (TEXT, default 'Cal Video')
├── guests (JSONB)
├── reschedule_requested (BOOLEAN)
├── reschedule_note (TEXT)
├── status (TEXT: upcoming/past/cancelled/rescheduled)
└── created_at (TIMESTAMP)
```

**Key Design Decisions:**
- UUIDs as primary keys for security (no sequential IDs exposed)
- `UNIQUE(event_type_id, date, start_time)` constraint + row-level locking in transactions to prevent double bookings
- JSONB for event type settings (flexible schema for extensible config)
- Separate `availability_schedules` and `availability_time_ranges` tables support multiple schedules per user

## Setup Instructions

### Prerequisites
- Node.js 18+
- PostgreSQL 14+

### 1. Database Setup

```bash
# Create database
createdb calclone

# Or via psql
psql -U postgres -c "CREATE DATABASE calclone;"
```

### 2. Backend

```bash
cd backend
npm install

# Set up environment (edit .env if needed)
# DATABASE_URL=postgresql://postgres:postgres@localhost:5432/calclone

npm run migrate   # Apply database schema
npm run seed      # Insert sample data (user, event types, availability, bookings)
npm run dev       # Start dev server on port 4000
```

### 3. Frontend

```bash
cd frontend
npm install
npm run dev       # Start dev server on port 5173
```

### 4. Access the App

- **Admin Dashboard:** http://localhost:5173/event-types
- **Public Profile:** http://localhost:5173/srijan
- **Public Booking:** http://localhost:5173/srijan/15-min-meeting

## Assumptions

- A default user ("srijan") is assumed to be logged in for the admin side. No authentication system is implemented.
- The public booking page is accessible without login.
- Timezone handling uses the browser's `Intl.DateTimeFormat().resolvedOptions().timeZone`.
- The frontend syncs with the backend on startup; if the backend is unavailable, it falls back to seeded local data.

## Project Structure

```
backend/
├── src/
│   ├── controllers/    # Request handlers (thin layer)
│   ├── services/       # Business logic
│   ├── repositories/   # Database queries
│   ├── middlewares/     # Error handling, validation, async wrapper
│   ├── validators/     # Zod schemas for request validation
│   ├── errors/         # ApiError class
│   ├── config/         # Default user config
│   ├── scripts/        # migrate.ts, seed.ts
│   ├── db.ts           # PostgreSQL connection pool
│   ├── server.ts       # Express app setup
│   └── index.ts        # Entry point
└── migrations/
    ├── schema.sql      # Database schema
    └── seed.sql        # (Seed data applied via script)

frontend/
├── src/
│   ├── components/     # Reusable UI components
│   │   ├── ui/         # Base components (Button, Input, Dialog, etc.)
│   │   ├── layout/     # Shell, Sidebar, Header
│   │   ├── booking/    # Public booking components
│   │   ├── bookings/   # Admin bookings components
│   │   └── event-types/# Event type management components
│   ├── pages/          # Full page components
│   ├── stores/         # Zustand state management
│   ├── lib/            # API client, utilities
│   ├── types/          # TypeScript interfaces
│   └── data/           # Seed/fallback data
```
