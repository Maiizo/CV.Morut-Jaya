-- Ensure brands table includes satuan for compatibility with updated APIs/UI
ALTER TABLE brands
  ADD COLUMN IF NOT EXISTS satuan TEXT;
