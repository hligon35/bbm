-- Migration to add cancellationToken column to existing bookings table
-- Run with: wrangler d1 execute bb_guest_schedule --file=./worker/src/api/schedule/migration-add-cancellation-token.sql

-- Add cancellationToken column
-- Note: For existing bookings, you may need to generate tokens separately or mark them as needing manual handling

-- Step 1: Add the column (SQLite doesn't support adding NOT NULL with ALTER, so we add it as nullable first)
ALTER TABLE bookings ADD COLUMN cancellationToken TEXT;

-- Step 2: Create index for performance
CREATE INDEX IF NOT EXISTS idx_bookings_cancellation_token ON bookings(cancellationToken);

-- Step 3: Generate dummy tokens for existing bookings (optional - these won't work for cancellation)
-- You may want to skip this and handle existing bookings manually
-- UPDATE bookings SET cancellationToken = lower(hex(randomblob(16))) WHERE cancellationToken IS NULL;

-- Note: After running this migration, new bookings will have proper tokens.
-- For existing bookings without tokens, they can still be cancelled via admin interface.
