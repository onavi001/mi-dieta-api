BEGIN;

ALTER TABLE IF EXISTS profiles
  ADD COLUMN IF NOT EXISTS daily_engagement JSONB DEFAULT '{}'::jsonb;

CREATE TABLE IF NOT EXISTS app_event_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  event_name TEXT NOT NULL,
  context JSONB DEFAULT '{}'::jsonb,
  context_signature TEXT DEFAULT '{}' NOT NULL,
  platform TEXT DEFAULT 'web',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE IF EXISTS app_event_logs
  ADD COLUMN IF NOT EXISTS context_signature TEXT DEFAULT '{}' NOT NULL;

CREATE INDEX IF NOT EXISTS idx_app_event_logs_user_created
  ON app_event_logs(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_app_event_logs_user_event_created
  ON app_event_logs(user_id, event_name, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_app_event_logs_user_event_sig_created
  ON app_event_logs(user_id, event_name, context_signature, created_at DESC);

ALTER TABLE app_event_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "app_event_logs_select_own_or_admin" ON app_event_logs;
CREATE POLICY "app_event_logs_select_own_or_admin"
ON app_event_logs FOR SELECT
USING (user_id = auth.uid());

DROP POLICY IF EXISTS "app_event_logs_insert_own_or_admin" ON app_event_logs;
CREATE POLICY "app_event_logs_insert_own_or_admin"
ON app_event_logs FOR INSERT
WITH CHECK (user_id = auth.uid());

COMMIT;
