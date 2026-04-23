CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Profiles (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  name TEXT NOT NULL,
  role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  nutritional_profile JSONB DEFAULT '{}',
  daily_engagement JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE IF EXISTS profiles
  ADD COLUMN IF NOT EXISTS daily_engagement JSONB DEFAULT '{}'::jsonb;

-- Official meal catalog used for alternatives and curated dish suggestions.
CREATE TABLE IF NOT EXISTS meals (
  id TEXT PRIMARY KEY,
  tipo TEXT NOT NULL CHECK (tipo IN ('Desayuno','Snack Mañana','Comida','Snack Tarde','Cena')),
  nombre TEXT NOT NULL,
  receta TEXT NOT NULL DEFAULT '',
  tip TEXT NOT NULL DEFAULT '',
  tags JSONB NOT NULL DEFAULT '[]'::jsonb,
  forbidden_ingredients TEXT[] NOT NULL DEFAULT '{}',
  ingredientes JSONB NOT NULL DEFAULT '[]'::jsonb,
  group_portions JSONB NOT NULL DEFAULT '{}'::jsonb,
  real_dish_metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE IF EXISTS meals
  ADD COLUMN IF NOT EXISTS group_portions JSONB NOT NULL DEFAULT '{}'::jsonb;

ALTER TABLE IF EXISTS meals
  ADD COLUMN IF NOT EXISTS real_dish_metadata JSONB NOT NULL DEFAULT '{}'::jsonb;

-- One row per user + week
CREATE TABLE IF NOT EXISTS meal_plan_weeks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) NOT NULL,
  week TEXT NOT NULL, -- e.g. "2026-W15"
  grocery_state JSONB DEFAULT '{}', -- grocery checklist UI state only
  grocery_adjustments JSONB DEFAULT '[]'::jsonb,
  suggestion_preferences JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, week)
);

-- One row per slot inside a week plan
CREATE TABLE IF NOT EXISTS meal_plan_slots (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  week_id UUID REFERENCES meal_plan_weeks(id) ON DELETE CASCADE NOT NULL,
  slot_id TEXT NOT NULL,
  day TEXT NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('Desayuno','Snack Mañana','Comida','Snack Tarde','Cena')),
  hour TEXT NOT NULL,
  meal_payload JSONB,
  meal_override_payload JSONB,
  ingredient_multipliers JSONB DEFAULT '{}'::jsonb,
  completed BOOLEAN DEFAULT FALSE,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(week_id, slot_id)
);

ALTER TABLE IF EXISTS meal_plan_slots
  ADD COLUMN IF NOT EXISTS meal_payload JSONB;

ALTER TABLE IF EXISTS meal_plan_weeks
  ADD COLUMN IF NOT EXISTS grocery_adjustments JSONB DEFAULT '[]'::jsonb;

ALTER TABLE IF EXISTS meal_plan_weeks
  ADD COLUMN IF NOT EXISTS suggestion_preferences JSONB DEFAULT '{}'::jsonb;

ALTER TABLE IF EXISTS meal_plan_slots
  ADD COLUMN IF NOT EXISTS meal_override_payload JSONB;

ALTER TABLE IF EXISTS meal_plan_slots
  ADD COLUMN IF NOT EXISTS ingredient_multipliers JSONB DEFAULT '{}'::jsonb;

ALTER TABLE IF EXISTS meal_plan_slots
  DROP COLUMN IF EXISTS meal_id;

-- User-to-user sharing to enable combined views
CREATE TABLE IF NOT EXISTS plan_shares (
  owner_user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  shared_with_user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  can_edit BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY(owner_user_id, shared_with_user_id),
  CONSTRAINT plan_shares_no_self CHECK (owner_user_id <> shared_with_user_id)
);

-- Share invitations before relationship is accepted
CREATE TABLE IF NOT EXISTS plan_share_invites (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  target_user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  can_edit BOOLEAN DEFAULT FALSE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT plan_share_invites_no_self CHECK (owner_user_id <> target_user_id),
  UNIQUE(owner_user_id, target_user_id)
);

-- Detailed nutrition profile per user (single current record)
CREATE TABLE IF NOT EXISTS nutrition_profiles (
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE PRIMARY KEY,
  objective_goal TEXT CHECK (
    objective_goal IN (
      'weight_loss',
      'rapid_weight_loss',
      'weight_maintenance',
      'muscle_gain',
      'weight_gain',
      'endurance_improvement',
      'healthy_diet'
    )
  ),
  age SMALLINT,
  biological_sex TEXT CHECK (biological_sex IN ('female', 'male', 'intersex', 'prefer_not_to_say')),
  height_cm NUMERIC(5,2),
  current_weight_kg NUMERIC(6,2),
  target_weight_kg NUMERIC(6,2),
  target_date DATE,
  body_fat_percent NUMERIC(5,2),
  waist_cm NUMERIC(5,2),
  hip_cm NUMERIC(5,2),
  neck_cm NUMERIC(5,2),
  avg_daily_steps INTEGER,
  activity_level TEXT,
  job_activity_level TEXT,
  training_days_per_week SMALLINT,
  training_minutes_per_session SMALLINT,
  training_intensity TEXT,
  sleep_hours NUMERIC(4,2),
  diagnoses TEXT[] DEFAULT '{}',
  medications TEXT[] DEFAULT '{}',
  supplements TEXT[] DEFAULT '{}',
  allergies TEXT[] DEFAULT '{}',
  intolerances TEXT[] DEFAULT '{}',
  digestive_symptoms TEXT[] DEFAULT '{}',
  lab_markers JSONB DEFAULT '{}',
  meal_schedule JSONB DEFAULT '[]',
  food_preferences TEXT[] DEFAULT '{}',
  food_dislikes TEXT[] DEFAULT '{}',
  budget_level TEXT,
  cooking_time_level TEXT,
  kitchen_equipment JSONB DEFAULT '[]',
  alcohol_frequency TEXT,
  meals_per_day SMALLINT,
  portion_system TEXT CHECK (portion_system IN ('grams', 'exchanges')),
  pre_post_workout_strategy TEXT,
  hunger_pattern JSONB DEFAULT '{}',
  special_days_notes TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT nutrition_profiles_age_check CHECK (age IS NULL OR age BETWEEN 10 AND 120),
  CONSTRAINT nutrition_profiles_steps_check CHECK (avg_daily_steps IS NULL OR avg_daily_steps >= 0),
  CONSTRAINT nutrition_profiles_meals_per_day_check CHECK (meals_per_day IS NULL OR meals_per_day BETWEEN 1 AND 8)
);

ALTER TABLE IF EXISTS nutrition_profiles
  ADD COLUMN IF NOT EXISTS objective_goal TEXT;

ALTER TABLE IF EXISTS nutrition_profiles
  DROP CONSTRAINT IF EXISTS nutrition_profiles_objective_goal_check;

ALTER TABLE IF EXISTS nutrition_profiles
  ADD CONSTRAINT nutrition_profiles_objective_goal_check CHECK (
    objective_goal IS NULL OR objective_goal IN (
      'weight_loss',
      'rapid_weight_loss',
      'weight_maintenance',
      'muscle_gain',
      'weight_gain',
      'endurance_improvement',
      'healthy_diet'
    )
  );

-- Versioned nutrition targets to track plan adjustments over time
CREATE TABLE IF NOT EXISTS nutrition_plan_versions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  version_number INTEGER NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  start_date DATE NOT NULL,
  end_date DATE,
  calorie_target_kcal INTEGER,
  protein_g NUMERIC(7,2),
  fat_g NUMERIC(7,2),
  carbs_g NUMERIC(7,2),
  hydration_ml INTEGER,
  portions_by_group JSONB NOT NULL DEFAULT '{}',
  distribution_by_meal JSONB NOT NULL DEFAULT '{}',
  adjustment_reason TEXT,
  coach_notes TEXT,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, version_number)
);

ALTER TABLE IF EXISTS nutrition_plan_versions
  ADD COLUMN IF NOT EXISTS distribution_by_meal JSONB NOT NULL DEFAULT '{}';

-- Daily/weekly progress logs to evaluate adherence and outcomes
CREATE TABLE IF NOT EXISTS nutrition_progress_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  log_date DATE NOT NULL,
  weight_kg NUMERIC(6,2),
  waist_cm NUMERIC(5,2),
  adherence_percent NUMERIC(5,2),
  hunger_score SMALLINT,
  energy_score SMALLINT,
  sleep_hours NUMERIC(4,2),
  steps INTEGER,
  training_done BOOLEAN,
  digestive_notes TEXT,
  stress_score SMALLINT,
  menstrual_cycle_phase TEXT,
  food_log JSONB DEFAULT '[]',
  weekly_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, log_date),
  CONSTRAINT nutrition_progress_hunger_check CHECK (hunger_score IS NULL OR hunger_score BETWEEN 1 AND 10),
  CONSTRAINT nutrition_progress_energy_check CHECK (energy_score IS NULL OR energy_score BETWEEN 1 AND 10),
  CONSTRAINT nutrition_progress_stress_check CHECK (stress_score IS NULL OR stress_score BETWEEN 1 AND 10),
  CONSTRAINT nutrition_progress_adherence_check CHECK (adherence_percent IS NULL OR (adherence_percent >= 0 AND adherence_percent <= 100))
);

CREATE TABLE IF NOT EXISTS app_event_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  event_name TEXT NOT NULL,
  context JSONB DEFAULT '{}'::jsonb,
  platform TEXT DEFAULT 'web',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_meal_plan_weeks_user_week ON meal_plan_weeks(user_id, week);
CREATE INDEX IF NOT EXISTS idx_meal_plan_slots_week_slot ON meal_plan_slots(week_id, slot_id);
CREATE INDEX IF NOT EXISTS idx_meals_tipo_nombre ON meals(tipo, nombre);
CREATE INDEX IF NOT EXISTS idx_plan_shares_shared_with ON plan_shares(shared_with_user_id);
CREATE INDEX IF NOT EXISTS idx_plan_share_invites_target_status ON plan_share_invites(target_user_id, status);
CREATE INDEX IF NOT EXISTS idx_nutrition_plan_versions_user_start ON nutrition_plan_versions(user_id, start_date DESC);
CREATE INDEX IF NOT EXISTS idx_nutrition_plan_versions_user_active ON nutrition_plan_versions(user_id, is_active);
CREATE INDEX IF NOT EXISTS idx_nutrition_progress_logs_user_date ON nutrition_progress_logs(user_id, log_date DESC);
CREATE INDEX IF NOT EXISTS idx_app_event_logs_user_created ON app_event_logs(user_id, created_at DESC);

-- Trigger: auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  safe_name TEXT;
BEGIN
  safe_name := COALESCE(
    NULLIF(BTRIM(NEW.raw_user_meta_data->>'name'), ''),
    NULLIF(split_part(COALESCE(NEW.email, ''), '@', 1), ''),
    'Usuario'
  );

  INSERT INTO public.profiles (id, name)
  VALUES (NEW.id, safe_name)
  ON CONFLICT (id) DO UPDATE
    SET name = EXCLUDED.name;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Keep updated_at fresh for week and slot records
CREATE OR REPLACE FUNCTION touch_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS meal_plan_weeks_touch_updated_at ON meal_plan_weeks;
CREATE TRIGGER meal_plan_weeks_touch_updated_at
  BEFORE UPDATE ON meal_plan_weeks
  FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

DROP TRIGGER IF EXISTS meals_touch_updated_at ON meals;
CREATE TRIGGER meals_touch_updated_at
  BEFORE UPDATE ON meals
  FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

DROP TRIGGER IF EXISTS meal_plan_slots_touch_updated_at ON meal_plan_slots;
CREATE TRIGGER meal_plan_slots_touch_updated_at
  BEFORE UPDATE ON meal_plan_slots
  FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

DROP TRIGGER IF EXISTS nutrition_profiles_touch_updated_at ON nutrition_profiles;
CREATE TRIGGER nutrition_profiles_touch_updated_at
  BEFORE UPDATE ON nutrition_profiles
  FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

DROP TRIGGER IF EXISTS nutrition_plan_versions_touch_updated_at ON nutrition_plan_versions;
CREATE TRIGGER nutrition_plan_versions_touch_updated_at
  BEFORE UPDATE ON nutrition_plan_versions
  FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

DROP TRIGGER IF EXISTS nutrition_progress_logs_touch_updated_at ON nutrition_progress_logs;
CREATE TRIGGER nutrition_progress_logs_touch_updated_at
  BEFORE UPDATE ON nutrition_progress_logs
  FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

-- RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE meal_plan_weeks ENABLE ROW LEVEL SECURITY;
ALTER TABLE meal_plan_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE plan_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE plan_share_invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE nutrition_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE nutrition_plan_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE nutrition_progress_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_event_logs ENABLE ROW LEVEL SECURITY;

-- Profiles policies
DROP POLICY IF EXISTS "profiles_select_own_or_shared" ON profiles;
CREATE POLICY "profiles_select_own_or_shared"
ON profiles FOR SELECT
USING (
  auth.uid() = id
  OR EXISTS (
    SELECT 1
    FROM plan_shares ps
    WHERE ps.owner_user_id = profiles.id
      AND ps.shared_with_user_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1
    FROM plan_shares ps
    WHERE ps.owner_user_id = auth.uid()
      AND ps.shared_with_user_id = profiles.id
  )
);

DROP POLICY IF EXISTS "profiles_update_own_or_admin" ON profiles;
CREATE POLICY "profiles_update_own_or_admin"
ON profiles FOR UPDATE
USING (
  auth.uid() = id
)
WITH CHECK (
  auth.uid() = id
);

DROP POLICY IF EXISTS "profiles_insert_own_or_admin" ON profiles;
CREATE POLICY "profiles_insert_own_or_admin"
ON profiles FOR INSERT
WITH CHECK (
  auth.uid() = id
);

-- Weeks policies
DROP POLICY IF EXISTS "weeks_select_own_or_shared_or_admin" ON meal_plan_weeks;
CREATE POLICY "weeks_select_own_or_shared_or_admin"
ON meal_plan_weeks FOR SELECT
USING (
  user_id = auth.uid()
  OR EXISTS (
    SELECT 1
    FROM plan_shares ps
    WHERE ps.owner_user_id = meal_plan_weeks.user_id
      AND ps.shared_with_user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "weeks_insert_own_or_admin" ON meal_plan_weeks;
CREATE POLICY "weeks_insert_own_or_admin"
ON meal_plan_weeks FOR INSERT
WITH CHECK (
  user_id = auth.uid()
);

DROP POLICY IF EXISTS "weeks_update_own_or_shared_edit_or_admin" ON meal_plan_weeks;
CREATE POLICY "weeks_update_own_or_shared_edit_or_admin"
ON meal_plan_weeks FOR UPDATE
USING (
  user_id = auth.uid()
  OR EXISTS (
    SELECT 1
    FROM plan_shares ps
    WHERE ps.owner_user_id = meal_plan_weeks.user_id
      AND ps.shared_with_user_id = auth.uid()
      AND ps.can_edit = TRUE
  )
)
WITH CHECK (
  user_id = auth.uid()
  OR EXISTS (
    SELECT 1
    FROM plan_shares ps
    WHERE ps.owner_user_id = meal_plan_weeks.user_id
      AND ps.shared_with_user_id = auth.uid()
      AND ps.can_edit = TRUE
  )
);

-- Slots policies (based on parent week ownership/sharing)
DROP POLICY IF EXISTS "slots_select_own_or_shared_or_admin" ON meal_plan_slots;
CREATE POLICY "slots_select_own_or_shared_or_admin"
ON meal_plan_slots FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM meal_plan_weeks w
    WHERE w.id = meal_plan_slots.week_id
      AND (
        w.user_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM plan_shares ps
          WHERE ps.owner_user_id = w.user_id
            AND ps.shared_with_user_id = auth.uid()
        )
      )
  )
);

DROP POLICY IF EXISTS "slots_insert_own_or_shared_edit_or_admin" ON meal_plan_slots;
CREATE POLICY "slots_insert_own_or_shared_edit_or_admin"
ON meal_plan_slots FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM meal_plan_weeks w
    WHERE w.id = meal_plan_slots.week_id
      AND (
        w.user_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM plan_shares ps
          WHERE ps.owner_user_id = w.user_id
            AND ps.shared_with_user_id = auth.uid()
            AND ps.can_edit = TRUE
        )
      )
  )
);

DROP POLICY IF EXISTS "slots_update_own_or_shared_edit_or_admin" ON meal_plan_slots;
CREATE POLICY "slots_update_own_or_shared_edit_or_admin"
ON meal_plan_slots FOR UPDATE
USING (
  EXISTS (
    SELECT 1
    FROM meal_plan_weeks w
    WHERE w.id = meal_plan_slots.week_id
      AND (
        w.user_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM plan_shares ps
          WHERE ps.owner_user_id = w.user_id
            AND ps.shared_with_user_id = auth.uid()
            AND ps.can_edit = TRUE
        )
      )
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM meal_plan_weeks w
    WHERE w.id = meal_plan_slots.week_id
      AND (
        w.user_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM plan_shares ps
          WHERE ps.owner_user_id = w.user_id
            AND ps.shared_with_user_id = auth.uid()
            AND ps.can_edit = TRUE
        )
      )
  )
);

DROP POLICY IF EXISTS "slots_delete_own_or_shared_edit_or_admin" ON meal_plan_slots;
CREATE POLICY "slots_delete_own_or_shared_edit_or_admin"
ON meal_plan_slots FOR DELETE
USING (
  EXISTS (
    SELECT 1
    FROM meal_plan_weeks w
    WHERE w.id = meal_plan_slots.week_id
      AND (
        w.user_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM plan_shares ps
          WHERE ps.owner_user_id = w.user_id
            AND ps.shared_with_user_id = auth.uid()
            AND ps.can_edit = TRUE
        )
      )
  )
);

-- Shares policies
DROP POLICY IF EXISTS "shares_select_own_rows_or_admin" ON plan_shares;
CREATE POLICY "shares_select_own_rows_or_admin"
ON plan_shares FOR SELECT
USING (
  owner_user_id = auth.uid()
  OR shared_with_user_id = auth.uid()
);

DROP POLICY IF EXISTS "shares_insert_owner_or_admin" ON plan_shares;
CREATE POLICY "shares_insert_owner_or_admin"
ON plan_shares FOR INSERT
WITH CHECK (
  owner_user_id = auth.uid()
);

DROP POLICY IF EXISTS "shares_update_owner_or_admin" ON plan_shares;
CREATE POLICY "shares_update_owner_or_admin"
ON plan_shares FOR UPDATE
USING (
  owner_user_id = auth.uid()
)
WITH CHECK (
  owner_user_id = auth.uid()
);

DROP POLICY IF EXISTS "shares_delete_owner_or_admin" ON plan_shares;
CREATE POLICY "shares_delete_owner_or_admin"
ON plan_shares FOR DELETE
USING (
  owner_user_id = auth.uid()
);

-- Share invites policies
DROP POLICY IF EXISTS "share_invites_select_own_or_admin" ON plan_share_invites;
CREATE POLICY "share_invites_select_own_or_admin"
ON plan_share_invites FOR SELECT
USING (
  owner_user_id = auth.uid()
  OR target_user_id = auth.uid()
);

DROP POLICY IF EXISTS "share_invites_insert_owner_or_admin" ON plan_share_invites;
CREATE POLICY "share_invites_insert_owner_or_admin"
ON plan_share_invites FOR INSERT
WITH CHECK (
  owner_user_id = auth.uid()
);

DROP POLICY IF EXISTS "share_invites_update_party_or_admin" ON plan_share_invites;
CREATE POLICY "share_invites_update_party_or_admin"
ON plan_share_invites FOR UPDATE
USING (
  owner_user_id = auth.uid()
  OR target_user_id = auth.uid()
)
WITH CHECK (
  owner_user_id = auth.uid()
  OR target_user_id = auth.uid()
);

-- Nutrition profiles policies
DROP POLICY IF EXISTS "nutrition_profiles_select_own_or_admin" ON nutrition_profiles;
CREATE POLICY "nutrition_profiles_select_own_or_admin"
ON nutrition_profiles FOR SELECT
USING (user_id = auth.uid());

DROP POLICY IF EXISTS "nutrition_profiles_insert_own_or_admin" ON nutrition_profiles;
CREATE POLICY "nutrition_profiles_insert_own_or_admin"
ON nutrition_profiles FOR INSERT
WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "nutrition_profiles_update_own_or_admin" ON nutrition_profiles;
CREATE POLICY "nutrition_profiles_update_own_or_admin"
ON nutrition_profiles FOR UPDATE
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Nutrition plan versions policies
DROP POLICY IF EXISTS "nutrition_plan_versions_select_own_or_admin" ON nutrition_plan_versions;
CREATE POLICY "nutrition_plan_versions_select_own_or_admin"
ON nutrition_plan_versions FOR SELECT
USING (user_id = auth.uid());

DROP POLICY IF EXISTS "nutrition_plan_versions_insert_own_or_admin" ON nutrition_plan_versions;
CREATE POLICY "nutrition_plan_versions_insert_own_or_admin"
ON nutrition_plan_versions FOR INSERT
WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "nutrition_plan_versions_update_own_or_admin" ON nutrition_plan_versions;
CREATE POLICY "nutrition_plan_versions_update_own_or_admin"
ON nutrition_plan_versions FOR UPDATE
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "nutrition_plan_versions_delete_own_or_admin" ON nutrition_plan_versions;
CREATE POLICY "nutrition_plan_versions_delete_own_or_admin"
ON nutrition_plan_versions FOR DELETE
USING (user_id = auth.uid());

-- Nutrition progress logs policies
DROP POLICY IF EXISTS "nutrition_progress_logs_select_own_or_admin" ON nutrition_progress_logs;
CREATE POLICY "nutrition_progress_logs_select_own_or_admin"
ON nutrition_progress_logs FOR SELECT
USING (user_id = auth.uid());

DROP POLICY IF EXISTS "nutrition_progress_logs_insert_own_or_admin" ON nutrition_progress_logs;
CREATE POLICY "nutrition_progress_logs_insert_own_or_admin"
ON nutrition_progress_logs FOR INSERT
WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "nutrition_progress_logs_update_own_or_admin" ON nutrition_progress_logs;
CREATE POLICY "nutrition_progress_logs_update_own_or_admin"
ON nutrition_progress_logs FOR UPDATE
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "nutrition_progress_logs_delete_own_or_admin" ON nutrition_progress_logs;
CREATE POLICY "nutrition_progress_logs_delete_own_or_admin"
ON nutrition_progress_logs FOR DELETE
USING (user_id = auth.uid());

-- App event logs policies
DROP POLICY IF EXISTS "app_event_logs_select_own_or_admin" ON app_event_logs;
CREATE POLICY "app_event_logs_select_own_or_admin"
ON app_event_logs FOR SELECT
USING (user_id = auth.uid());

DROP POLICY IF EXISTS "app_event_logs_insert_own_or_admin" ON app_event_logs;
CREATE POLICY "app_event_logs_insert_own_or_admin"
ON app_event_logs FOR INSERT
WITH CHECK (user_id = auth.uid());
