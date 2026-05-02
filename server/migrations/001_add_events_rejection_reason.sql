-- Run against existing DB (e.g. Supabase SQL editor) if schema was applied before rejection_reason existed.
ALTER TABLE events
  ADD COLUMN IF NOT EXISTS rejection_reason TEXT;
