-- Mini dashboard: eventos de producto (últimos 30 días)
-- Ejecuta cada bloque por separado en Supabase SQL editor.

-- 1) Volumen diario de eventos
SELECT
  date_trunc('day', created_at)::date AS day,
  COUNT(*) AS total_events
FROM app_event_logs
WHERE created_at >= now() - interval '30 days'
GROUP BY 1
ORDER BY 1 DESC;

-- 2) Top eventos por volumen (últimos 30 días)
SELECT
  event_name,
  COUNT(*) AS total_events,
  COUNT(DISTINCT user_id) AS unique_users
FROM app_event_logs
WHERE created_at >= now() - interval '30 days'
GROUP BY event_name
ORDER BY total_events DESC
LIMIT 20;

-- 3) Dedupe estimado: eventos repetidos por user+event+context en ventana 45s
WITH ordered AS (
  SELECT
    id,
    user_id,
    event_name,
    context_signature,
    created_at,
    lag(created_at) OVER (
      PARTITION BY user_id, event_name, context_signature
      ORDER BY created_at
    ) AS prev_created_at
  FROM app_event_logs
  WHERE created_at >= now() - interval '30 days'
)
SELECT
  COUNT(*) AS total_inserted_events,
  COUNT(*) FILTER (
    WHERE prev_created_at IS NOT NULL
      AND created_at - prev_created_at <= interval '45 seconds'
  ) AS repeated_within_45s,
  ROUND(
    100.0 * COUNT(*) FILTER (
      WHERE prev_created_at IS NOT NULL
        AND created_at - prev_created_at <= interval '45 seconds'
    ) / NULLIF(COUNT(*), 0),
    2
  ) AS repeated_within_45s_pct
FROM ordered;

-- 4) Funnel simple TodayBrief (últimos 30 días)
WITH base AS (
  SELECT
    user_id,
    date_trunc('day', created_at)::date AS day,
    event_name
  FROM app_event_logs
  WHERE created_at >= now() - interval '30 days'
    AND event_name IN (
      'today_brief_viewed',
      'today_brief_checkin',
      'today_brief_go_to_meal_click',
      'suggested_meal_applied'
    )
  GROUP BY 1,2,3
),
per_user_day AS (
  SELECT
    user_id,
    day,
    BOOL_OR(event_name = 'today_brief_viewed') AS viewed,
    BOOL_OR(event_name = 'today_brief_checkin') AS checkin,
    BOOL_OR(event_name = 'today_brief_go_to_meal_click') AS go_to_meal,
    BOOL_OR(event_name = 'suggested_meal_applied') AS suggested_applied
  FROM base
  GROUP BY 1,2
)
SELECT
  day,
  COUNT(*) FILTER (WHERE viewed) AS users_viewed,
  COUNT(*) FILTER (WHERE checkin) AS users_checkin,
  COUNT(*) FILTER (WHERE go_to_meal) AS users_go_to_meal,
  COUNT(*) FILTER (WHERE suggested_applied) AS users_suggested_applied,
  ROUND(
    100.0 * COUNT(*) FILTER (WHERE checkin) / NULLIF(COUNT(*) FILTER (WHERE viewed), 0),
    2
  ) AS checkin_from_view_pct
FROM per_user_day
GROUP BY day
ORDER BY day DESC;

-- 5) Estado actual de engagement guardado por usuario
SELECT
  p.id AS user_id,
  p.name,
  p.daily_engagement ->> 'date' AS engagement_date,
  p.daily_engagement ->> 'mood' AS mood,
  COALESCE((p.daily_engagement ->> 'streak')::int, 0) AS streak,
  p.daily_engagement ->> 'lastGoodDate' AS last_good_date,
  p.daily_engagement ->> 'updatedAt' AS updated_at
FROM profiles p
WHERE p.daily_engagement IS NOT NULL
  AND p.daily_engagement::text <> '{}'::text
ORDER BY COALESCE((p.daily_engagement ->> 'streak')::int, 0) DESC, p.name ASC
LIMIT 200;

-- 6) Check-ins por mood (últimos 30 días)
SELECT
  date_trunc('day', created_at)::date AS day,
  COALESCE(context ->> 'mood', 'unknown') AS mood,
  COUNT(*) AS total
FROM app_event_logs
WHERE created_at >= now() - interval '30 days'
  AND event_name = 'today_brief_checkin'
GROUP BY 1,2
ORDER BY day DESC, total DESC;

