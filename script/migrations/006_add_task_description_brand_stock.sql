-- Migration 006: task descriptions, brand catalog, and stock tracking

-- 1) Description on task_definitions
ALTER TABLE task_definitions
  ADD COLUMN IF NOT EXISTS description TEXT;

-- 2) Brand catalog per pekerjaan
CREATE TABLE IF NOT EXISTS brands (
  id SERIAL PRIMARY KEY,
  task_def_id INTEGER NOT NULL REFERENCES task_definitions(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  satuan TEXT,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(task_def_id, name)
);
CREATE INDEX IF NOT EXISTS idx_brands_task ON brands(task_def_id);

-- 3) Stock per brand (non-negative)
CREATE TABLE IF NOT EXISTS brand_stocks (
  brand_id INTEGER PRIMARY KEY REFERENCES brands(id) ON DELETE CASCADE,
  stock INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4) Track brand used on each activity log
ALTER TABLE activity_logs
  ADD COLUMN IF NOT EXISTS brand_id INTEGER REFERENCES brands(id) ON DELETE SET NULL;
