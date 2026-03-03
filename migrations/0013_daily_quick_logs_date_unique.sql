-- Add date column to daily_quick_logs (derived from recorded_at for uniqueness per user per day)
ALTER TABLE daily_quick_logs ADD COLUMN IF NOT EXISTS log_date date;

-- Backfill existing rows: set log_date from recorded_at
UPDATE daily_quick_logs SET log_date = DATE(recorded_at) WHERE log_date IS NULL;

-- Deduplicate: keep only the most recent row per (user_id, log_date) before adding unique constraint
DELETE FROM daily_quick_logs a
USING daily_quick_logs b
WHERE a.user_id = b.user_id
  AND a.log_date = b.log_date
  AND a.recorded_at < b.recorded_at;

-- Set NOT NULL after backfill
ALTER TABLE daily_quick_logs ALTER COLUMN log_date SET NOT NULL;

-- Add unique constraint: one entry per user per day
CREATE UNIQUE INDEX IF NOT EXISTS idx_daily_quick_logs_user_log_date
  ON daily_quick_logs (user_id, log_date);
