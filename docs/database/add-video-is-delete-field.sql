-- Migration: Add is_delete field for video soft delete
-- Date: 2025-10-01
-- Purpose: Enable soft delete functionality for video_generations table

-- ============================================================
-- STEP 1: Add is_delete column
-- ============================================================
ALTER TABLE video_generations
ADD COLUMN IF NOT EXISTS is_delete BOOLEAN DEFAULT false;

COMMENT ON COLUMN video_generations.is_delete IS 'Soft delete flag: true = deleted, false = active';

-- ============================================================
-- STEP 2: Create optimized partial index
-- ============================================================
-- Only index active (non-deleted) records to save space and improve query speed
-- Note: Run this separately in a new query (cannot run CONCURRENTLY in a transaction)
-- CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_video_generations_active_records
-- ON video_generations(user_id, created_at DESC)
-- WHERE is_delete = false;

-- ============================================================
-- VERIFICATION
-- ============================================================
-- Check the new field exists
SELECT column_name, data_type, column_default, is_nullable
FROM information_schema.columns
WHERE table_name = 'video_generations'
AND column_name = 'is_delete';

-- ============================================================
-- ROLLBACK (if needed)
-- ============================================================
/*
DROP INDEX CONCURRENTLY IF EXISTS idx_video_generations_active_records;
ALTER TABLE video_generations DROP COLUMN IF EXISTS is_delete;
*/
