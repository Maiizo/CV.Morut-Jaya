-- Migration: create locations table and add partners column to activity_logs

-- Create locations table if not exists
CREATE TABLE IF NOT EXISTS locations (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add partners column to activity_logs if not exists (text to allow comma-separated names)
ALTER TABLE activity_logs
  ADD COLUMN IF NOT EXISTS partners TEXT;

-- Add locations table index on name for faster lookups
CREATE INDEX IF NOT EXISTS idx_locations_name ON locations (name);
