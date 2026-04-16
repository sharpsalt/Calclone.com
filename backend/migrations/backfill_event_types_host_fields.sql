-- Backfill host_name and host_timezone from users into event_types
BEGIN;
UPDATE event_types et
SET host_name = u.name,
    host_timezone = u.timezone,
    updated_at = now()
FROM users u
WHERE et.user_id = u.id
  AND (et.host_name IS NULL OR et.host_timezone IS NULL);
COMMIT;
