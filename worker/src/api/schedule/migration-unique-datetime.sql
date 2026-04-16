-- Migration: Add UNIQUE constraint on datetime to prevent double-bookings.
--
-- Run with: wrangler d1 execute bb_guest_schedule --remote --file=worker/src/api/schedule/migration-unique-datetime.sql
--
-- IMPORTANT: Before applying, verify there are no existing duplicate datetimes:
--   SELECT datetime, COUNT(*) c FROM bookings GROUP BY datetime HAVING c > 1;
-- If duplicates exist, resolve them first (cancel duplicates or update their datetime).

CREATE UNIQUE INDEX IF NOT EXISTS idx_bookings_unique_datetime
  ON bookings (datetime)
  WHERE status = 'confirmed' OR status IS NULL;
