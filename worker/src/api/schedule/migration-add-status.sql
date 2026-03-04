-- Migration to add status column to existing bookings table
-- Run with: wrangler d1 execute bb_guest_schedule --file=./worker/src/api/schedule/migration-add-status.sql

-- Add status column if it doesn't exist (with default 'confirmed' for existing records)
ALTER TABLE bookings ADD COLUMN status TEXT DEFAULT 'confirmed';

-- Create index on status column for faster queries
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);

-- Set all existing bookings to 'confirmed' status
UPDATE bookings SET status = 'confirmed' WHERE status IS NULL;
