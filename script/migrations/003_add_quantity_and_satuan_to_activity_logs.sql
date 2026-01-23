-- Migration: add quantity and satuan columns to activity_logs if not exists

ALTER TABLE activity_logs
  ADD COLUMN IF NOT EXISTS quantity TEXT;

ALTER TABLE activity_logs
  ADD COLUMN IF NOT EXISTS satuan TEXT;
