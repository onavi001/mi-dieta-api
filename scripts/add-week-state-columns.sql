BEGIN;

ALTER TABLE IF EXISTS meal_plan_weeks
  ADD COLUMN IF NOT EXISTS grocery_adjustments JSONB DEFAULT '[]'::jsonb;

ALTER TABLE IF EXISTS meal_plan_slots
  ADD COLUMN IF NOT EXISTS meal_override_payload JSONB;

ALTER TABLE IF EXISTS meal_plan_slots
  ADD COLUMN IF NOT EXISTS ingredient_multipliers JSONB DEFAULT '{}'::jsonb;

UPDATE meal_plan_weeks
SET grocery_adjustments = COALESCE(grocery_state->'groceryAdjustments', '[]'::jsonb)
WHERE grocery_adjustments IS NULL
   OR grocery_adjustments = '[]'::jsonb;

UPDATE meal_plan_slots AS slot
SET meal_override_payload = source.meal_override_payload
FROM (
  SELECT
    s.id,
    (w.grocery_state->'mealOverrides')->s.slot_id AS meal_override_payload
  FROM meal_plan_slots AS s
  JOIN meal_plan_weeks AS w ON w.id = s.week_id
) AS source
WHERE slot.id = source.id;

UPDATE meal_plan_slots AS slot
SET ingredient_multipliers = COALESCE(filtered.payload, '{}'::jsonb)
FROM (
  SELECT
    s.id,
    COALESCE(
      (
        SELECT jsonb_object_agg(entry.key, entry.value)
        FROM jsonb_each(COALESCE(w.grocery_state->'ingredientMultipliers', '{}'::jsonb)) AS entry(key, value)
        WHERE entry.key LIKE s.slot_id || '::%'
      ),
      '{}'::jsonb
    ) AS payload
  FROM meal_plan_slots AS s
  JOIN meal_plan_weeks AS w ON w.id = s.week_id
) AS filtered
WHERE slot.id = filtered.id;

UPDATE meal_plan_weeks
SET grocery_state = COALESCE(grocery_state, '{}'::jsonb)
  - 'mealOverrides'
  - 'ingredientMultipliers'
  - 'groceryAdjustments';

COMMIT;