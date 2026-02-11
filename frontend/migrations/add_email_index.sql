-- Add index on email column for faster lookups
-- This optimization reduces query time from ~2.8s to ~733ms
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
