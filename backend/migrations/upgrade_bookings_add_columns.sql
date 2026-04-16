-- Ensure bookings table has columns added in newer schema
BEGIN;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS location TEXT DEFAULT 'Cal Video';
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS guests JSONB NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS reschedule_requested BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS reschedule_note TEXT;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS reported_reason TEXT;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS is_no_show BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'upcoming';
-- Ensure per-day unique booking constraint exists (prevent double-booking same time on same day)
DO $$
BEGIN
	-- If an old constraint exists, drop it so we can create a partial unique index
	IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'unique_booking_slot') THEN
		EXECUTE 'ALTER TABLE bookings DROP CONSTRAINT unique_booking_slot';
	END IF;

	-- Create a partial unique index to prevent double-booking on the same day/time for non-cancelled bookings
	IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relname = 'unique_booking_slot') THEN
		EXECUTE 'CREATE UNIQUE INDEX unique_booking_slot ON bookings(event_type_id, date, start_time) WHERE status <> ''cancelled''';
	END IF;
END$$;

COMMIT;
