-- D1 schema for invite-only scheduler
--
-- Apply with Wrangler (example):
--   wrangler d1 execute <DB_NAME> --file=./src/api/schedule/schema.sql
--
-- Replace <DB_NAME> with your D1 database name.

CREATE TABLE IF NOT EXISTS bookings (
  id TEXT PRIMARY KEY,
  token TEXT NOT NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  datetime TEXT NOT NULL,
  notes TEXT,
  createdAt INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_bookings_datetime ON bookings(datetime);
CREATE INDEX IF NOT EXISTS idx_bookings_email ON bookings(email);
