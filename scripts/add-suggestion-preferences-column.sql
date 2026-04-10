BEGIN;

ALTER TABLE IF EXISTS meal_plan_weeks
  ADD COLUMN IF NOT EXISTS suggestion_preferences JSONB DEFAULT '{}'::jsonb;

UPDATE meal_plan_weeks
SET suggestion_preferences = COALESCE(grocery_state->'suggestionPreferences', '{}'::jsonb)
WHERE suggestion_preferences IS NULL
   OR suggestion_preferences = '{}'::jsonb;

UPDATE meal_plan_weeks
SET grocery_state = COALESCE(grocery_state, '{}'::jsonb)
  - 'suggestionPreferences';

COMMIT;