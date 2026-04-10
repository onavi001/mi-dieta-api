-- Migration: move from global meals catalog to generated meal payloads per slot.
-- Safe to run multiple times.

BEGIN;

-- 1) Ensure new slot payload column exists.
ALTER TABLE IF EXISTS meal_plan_slots
  ADD COLUMN IF NOT EXISTS meal_payload JSONB;

-- 2) Clear old slot assignments that depended on meals catalog.
UPDATE meal_plan_slots
SET meal_payload = NULL,
    completed = FALSE,
    updated_at = NOW();

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'meal_plan_slots'
      AND column_name = 'meal_id'
  ) THEN
    EXECUTE 'UPDATE public.meal_plan_slots SET meal_id = NULL';
  END IF;
END $$;

-- 3) Drop FK from meal_plan_slots.meal_id -> meals.id if it exists.
DO $$
DECLARE
  fk_name text;
BEGIN
  SELECT tc.constraint_name INTO fk_name
  FROM information_schema.table_constraints tc
  JOIN information_schema.key_column_usage kcu
    ON tc.constraint_name = kcu.constraint_name
   AND tc.table_schema = kcu.table_schema
  WHERE tc.table_schema = 'public'
    AND tc.table_name = 'meal_plan_slots'
    AND tc.constraint_type = 'FOREIGN KEY'
    AND kcu.column_name = 'meal_id'
  LIMIT 1;

  IF fk_name IS NOT NULL THEN
    EXECUTE format('ALTER TABLE public.meal_plan_slots DROP CONSTRAINT %I', fk_name);
  END IF;
END $$;

-- 4) Remove meal_id column (optional but recommended to avoid accidental reuse).
ALTER TABLE IF EXISTS meal_plan_slots
  DROP COLUMN IF EXISTS meal_id;

-- 5) Optional final cleanup: drop obsolete meals table.
DROP TABLE IF EXISTS meals;

COMMIT;
