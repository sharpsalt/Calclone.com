-- Add a manage token to bookings so attendees can manage their booking via an unguessable link
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS manage_token TEXT;

-- Unique index on manage_token to ensure tokens are unique (NULLs allowed)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relname = 'idx_bookings_manage_token') THEN
    EXECUTE 'CREATE UNIQUE INDEX idx_bookings_manage_token ON bookings(manage_token)';
  END IF;
END$$;
