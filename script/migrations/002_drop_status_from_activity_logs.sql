-- Migration: drop status column from activity_logs if it exists

ALTER TABLE activity_logs
  DROP COLUMN IF EXISTS status;