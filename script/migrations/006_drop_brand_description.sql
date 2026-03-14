-- Drop unused description column from brands
ALTER TABLE brands
  DROP COLUMN IF EXISTS description;
