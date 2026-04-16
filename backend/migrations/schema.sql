-- Schema for Calclone backend
-- Tables: users, event_types, availability_schedules, availability_time_ranges, bookings

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  name TEXT,
  timezone TEXT,
  avatar TEXT,
  created_at TIMESTAMP DEFAULT now()
);

CREATE TABLE IF NOT EXISTS event_types (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  duration_minutes INTEGER NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  host_name TEXT,
  host_timezone TEXT,
  settings JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

CREATE TABLE IF NOT EXISTS availability_schedules (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name TEXT,
  timezone TEXT NOT NULL,
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

CREATE TABLE IF NOT EXISTS availability_time_ranges (
  id UUID PRIMARY KEY,
  schedule_id UUID REFERENCES availability_schedules(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL,       -- 0 = Sunday, 6 = Saturday
  start_time TIME NOT NULL,
  end_time TIME NOT NULL
);

CREATE TABLE IF NOT EXISTS bookings (
  id UUID PRIMARY KEY,
  event_type_id UUID REFERENCES event_types(id) ON DELETE CASCADE,
  schedule_id UUID REFERENCES availability_schedules(id),
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  booker_name TEXT NOT NULL,
  booker_email TEXT NOT NULL,
  location TEXT DEFAULT 'Cal Video',
  guests JSONB NOT NULL DEFAULT '[]'::jsonb,
  reschedule_requested BOOLEAN NOT NULL DEFAULT FALSE,
  reschedule_note TEXT,
  reported_reason TEXT,
  is_no_show BOOLEAN NOT NULL DEFAULT FALSE,
  status TEXT NOT NULL DEFAULT 'upcoming',   -- upcoming, past, cancelled, rescheduled
  created_at TIMESTAMP DEFAULT now()
);

-- Prevent double booking: same event type + date + start time
-- Ensure a uniqueness rule that only applies to non-cancelled bookings.
-- Use a partial unique index so cancelled bookings can be rebooked.
DO $$
BEGIN
  -- If an old constraint with this name exists, drop it so we can create a partial index
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'unique_booking_slot') THEN
    EXECUTE 'ALTER TABLE bookings DROP CONSTRAINT unique_booking_slot';
  END IF;

  -- Create a partial unique index if it doesn't already exist
  IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relname = 'unique_booking_slot') THEN
    EXECUTE 'CREATE UNIQUE INDEX unique_booking_slot ON bookings(event_type_id, date, start_time) WHERE status <> ''cancelled''';
  END IF;
END$$;

-- Indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_bookings_status_date ON bookings(status, date, start_time);
CREATE INDEX IF NOT EXISTS idx_bookings_event_type_date ON bookings(event_type_id, date, start_time);
CREATE INDEX IF NOT EXISTS idx_event_types_user_active ON event_types(user_id, is_active, created_at DESC);

-- Audit logs for important state changes
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY,
  user_id UUID,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  action TEXT NOT NULL,
  old_value JSONB,
  new_value JSONB,
  created_at TIMESTAMP DEFAULT now()
);

-- Emails associated with a user (multiple addresses)
CREATE TABLE IF NOT EXISTS user_emails (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  is_primary BOOLEAN NOT NULL DEFAULT FALSE,
  verified BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_emails_unique ON user_emails(user_id, email);
CREATE INDEX IF NOT EXISTS idx_user_emails_user ON user_emails(user_id);
