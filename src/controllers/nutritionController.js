const { createUserClient } = require('../config/supabase')
const { calculateNutritionPlan } = require('../utils/nutritionCalculator')
const { userIdFromReq } = require('../utils/safeLog')

function success(res, data, status = 200) {
  return res.status(status).json({ ok: true, data })
}

function failure(res, error, status = 400) {
  return res.status(status).json({ ok: false, error })
}

function clampNumber(value, min, max) {
  if (typeof value !== 'number' || Number.isNaN(value)) return null
  return Math.min(Math.max(value, min), max)
}

function normalizeProfilePayload(body = {}) {
  const payload = {}

  const assign = (key, value) => {
    if (value !== undefined) payload[key] = value
  }

  assign('objective_goal', typeof body.objectiveGoal === 'string' ? body.objectiveGoal : undefined)
  assign('age', typeof body.age === 'number' ? Math.round(body.age) : undefined)
  assign('biological_sex', typeof body.biologicalSex === 'string' ? body.biologicalSex : undefined)
  assign('height_cm', typeof body.heightCm === 'number' ? body.heightCm : undefined)
  assign('current_weight_kg', typeof body.currentWeightKg === 'number' ? body.currentWeightKg : undefined)
  assign('target_weight_kg', typeof body.targetWeightKg === 'number' ? body.targetWeightKg : undefined)
  assign('target_date', typeof body.targetDate === 'string' ? body.targetDate : undefined)
  assign('body_fat_percent', typeof body.bodyFatPercent === 'number' ? body.bodyFatPercent : undefined)
  assign('waist_cm', typeof body.waistCm === 'number' ? body.waistCm : undefined)
  assign('hip_cm', typeof body.hipCm === 'number' ? body.hipCm : undefined)
  assign('neck_cm', typeof body.neckCm === 'number' ? body.neckCm : undefined)
  assign('avg_daily_steps', typeof body.avgDailySteps === 'number' ? Math.round(body.avgDailySteps) : undefined)
  assign('activity_level', typeof body.activityLevel === 'string' ? body.activityLevel : undefined)
  assign('job_activity_level', typeof body.jobActivityLevel === 'string' ? body.jobActivityLevel : undefined)
  assign('training_days_per_week', typeof body.trainingDaysPerWeek === 'number' ? Math.round(body.trainingDaysPerWeek) : undefined)
  assign('training_minutes_per_session', typeof body.trainingMinutesPerSession === 'number' ? Math.round(body.trainingMinutesPerSession) : undefined)
  assign('training_intensity', typeof body.trainingIntensity === 'string' ? body.trainingIntensity : undefined)
  assign('sleep_hours', typeof body.sleepHours === 'number' ? body.sleepHours : undefined)
  assign('diagnoses', Array.isArray(body.diagnoses) ? body.diagnoses : undefined)
  assign('medications', Array.isArray(body.medications) ? body.medications : undefined)
  assign('supplements', Array.isArray(body.supplements) ? body.supplements : undefined)
  assign('allergies', Array.isArray(body.allergies) ? body.allergies : undefined)
  assign('intolerances', Array.isArray(body.intolerances) ? body.intolerances : undefined)
  assign('digestive_symptoms', Array.isArray(body.digestiveSymptoms) ? body.digestiveSymptoms : undefined)
  assign('lab_markers', body.labMarkers && typeof body.labMarkers === 'object' ? body.labMarkers : undefined)
  assign('meal_schedule', Array.isArray(body.mealSchedule) ? body.mealSchedule : undefined)
  assign('food_preferences', Array.isArray(body.foodPreferences) ? body.foodPreferences : undefined)
  assign('food_dislikes', Array.isArray(body.foodDislikes) ? body.foodDislikes : undefined)
  assign('budget_level', typeof body.budgetLevel === 'string' ? body.budgetLevel : undefined)
  assign('cooking_time_level', typeof body.cookingTimeLevel === 'string' ? body.cookingTimeLevel : undefined)
  assign('kitchen_equipment', Array.isArray(body.kitchenEquipment) ? body.kitchenEquipment : undefined)
  assign('alcohol_frequency', typeof body.alcoholFrequency === 'string' ? body.alcoholFrequency : undefined)
  assign('meals_per_day', typeof body.mealsPerDay === 'number' ? Math.round(body.mealsPerDay) : undefined)
  assign('portion_system', typeof body.portionSystem === 'string' ? body.portionSystem : undefined)
  assign(
    'pre_post_workout_strategy',
    typeof body.prePostWorkoutStrategy === 'string' ? body.prePostWorkoutStrategy : undefined
  )
  assign('hunger_pattern', body.hungerPattern && typeof body.hungerPattern === 'object' ? body.hungerPattern : undefined)
  assign('special_days_notes', typeof body.specialDaysNotes === 'string' ? body.specialDaysNotes : undefined)
  assign('notes', typeof body.notes === 'string' ? body.notes : undefined)

  return payload
}

function normalizePlanVersionPayload(body = {}) {
  const payload = {}

  if (typeof body.startDate === 'string') payload.start_date = body.startDate
  if (body.endDate === null || typeof body.endDate === 'string') payload.end_date = body.endDate
  if (typeof body.calorieTargetKcal === 'number') payload.calorie_target_kcal = Math.round(body.calorieTargetKcal)
  if (typeof body.proteinG === 'number') payload.protein_g = body.proteinG
  if (typeof body.fatG === 'number') payload.fat_g = body.fatG
  if (typeof body.carbsG === 'number') payload.carbs_g = body.carbsG
  if (typeof body.hydrationMl === 'number') payload.hydration_ml = Math.round(body.hydrationMl)
  if (body.portionsByGroup && typeof body.portionsByGroup === 'object') payload.portions_by_group = body.portionsByGroup
  if (body.distributionByMeal && typeof body.distributionByMeal === 'object') {
    payload.distribution_by_meal = body.distributionByMeal
  }
  if (typeof body.adjustmentReason === 'string') payload.adjustment_reason = body.adjustmentReason
  if (typeof body.coachNotes === 'string') payload.coach_notes = body.coachNotes

  return payload
}

function normalizeProgressPayload(body = {}) {
  const payload = {}

  if (typeof body.logDate === 'string') payload.log_date = body.logDate
  if (typeof body.weightKg === 'number') payload.weight_kg = body.weightKg
  if (typeof body.waistCm === 'number') payload.waist_cm = body.waistCm
  if (typeof body.adherencePercent === 'number') payload.adherence_percent = clampNumber(body.adherencePercent, 0, 100)
  if (typeof body.hungerScore === 'number') payload.hunger_score = clampNumber(Math.round(body.hungerScore), 1, 10)
  if (typeof body.energyScore === 'number') payload.energy_score = clampNumber(Math.round(body.energyScore), 1, 10)
  if (typeof body.sleepHours === 'number') payload.sleep_hours = body.sleepHours
  if (typeof body.steps === 'number') payload.steps = Math.round(body.steps)
  if (typeof body.trainingDone === 'boolean') payload.training_done = body.trainingDone
  if (typeof body.digestiveNotes === 'string') payload.digestive_notes = body.digestiveNotes
  if (typeof body.stressScore === 'number') payload.stress_score = clampNumber(Math.round(body.stressScore), 1, 10)
  if (typeof body.menstrualCyclePhase === 'string') payload.menstrual_cycle_phase = body.menstrualCyclePhase
  if (Array.isArray(body.foodLog)) payload.food_log = body.foodLog
  if (typeof body.weeklyNotes === 'string') payload.weekly_notes = body.weeklyNotes

  return payload
}

async function getNutritionSummary(req, res) {
  try {
    req.log?.debug({ ...userIdFromReq(req), event: 'nutrition.summary' }, 'nutrition')
    const supabase = createUserClient(req.accessToken)
    const userId = req.user.id

    const [profileResult, activePlanResult, checkinsResult] = await Promise.all([
      supabase
        .from('nutrition_profiles')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle(),
      supabase
        .from('nutrition_plan_versions')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .order('version_number', { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from('nutrition_progress_logs')
        .select('*')
        .eq('user_id', userId)
        .order('log_date', { ascending: false })
        .limit(14),
    ])

    if (profileResult.error) return failure(res, profileResult.error.message, 400)
    if (activePlanResult.error) return failure(res, activePlanResult.error.message, 400)
    if (checkinsResult.error) return failure(res, checkinsResult.error.message, 400)

    return success(res, {
      nutritionProfile: profileResult.data || null,
      activePlanVersion: activePlanResult.data || null,
      recentProgress: checkinsResult.data || [],
    })
  } catch (error) {
    req.log?.error({ err: error, ...userIdFromReq(req), event: 'nutrition.summary_error' }, 'nutrition')
    return failure(res, 'Failed to fetch nutrition summary', 500)
  }
}

async function upsertNutritionProfile(req, res) {
  try {
    const payload = normalizeProfilePayload(req.body || {})
    req.log?.info({ ...userIdFromReq(req), event: 'nutrition.profile_upsert', fieldCount: Object.keys(payload).length }, 'nutrition')
    const supabase = createUserClient(req.accessToken)
    const userId = req.user.id

    if (Object.keys(payload).length === 0) {
      return failure(res, 'No profile fields provided to update')
    }

    const { data, error } = await supabase
      .from('nutrition_profiles')
      .upsert({ user_id: userId, ...payload }, { onConflict: 'user_id' })
      .select('*')
      .single()

    if (error) {
      return failure(res, error.message, 400)
    }

    return success(res, { nutritionProfile: data })
  } catch (error) {
    req.log?.error({ err: error, ...userIdFromReq(req), event: 'nutrition.profile_upsert_error' }, 'nutrition')
    return failure(res, 'Failed to upsert nutrition profile', 500)
  }
}

async function listPlanVersions(req, res) {
  try {
    req.log?.debug({ ...userIdFromReq(req), event: 'nutrition.list_versions' }, 'nutrition')
    const supabase = createUserClient(req.accessToken)

    const { data, error } = await supabase
      .from('nutrition_plan_versions')
      .select('*')
      .eq('user_id', req.user.id)
      .order('version_number', { ascending: false })

    if (error) {
      return failure(res, error.message, 400)
    }

    return success(res, { planVersions: data || [] })
  } catch (error) {
    req.log?.error({ err: error, ...userIdFromReq(req), event: 'nutrition.list_versions_error' }, 'nutrition')
    return failure(res, 'Failed to list plan versions', 500)
  }
}

async function createPlanVersion(req, res) {
  try {
    req.log?.info({ ...userIdFromReq(req), event: 'nutrition.plan_version_create' }, 'nutrition')
    const supabase = createUserClient(req.accessToken)
    const userId = req.user.id

    const normalized = normalizePlanVersionPayload(req.body || {})
    if (!normalized.start_date) {
      return failure(res, 'startDate is required')
    }

    if (!normalized.portions_by_group) {
      return failure(res, 'portionsByGroup is required')
    }

    const { data: latest, error: latestError } = await supabase
      .from('nutrition_plan_versions')
      .select('version_number')
      .eq('user_id', userId)
      .order('version_number', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (latestError) return failure(res, latestError.message, 400)

    const nextVersion = (latest?.version_number || 0) + 1

    const { error: deactivateError } = await supabase
      .from('nutrition_plan_versions')
      .update({ is_active: false })
      .eq('user_id', userId)
      .eq('is_active', true)

    if (deactivateError) return failure(res, deactivateError.message, 400)

    const { data, error } = await supabase
      .from('nutrition_plan_versions')
      .insert({
        user_id: userId,
        version_number: nextVersion,
        is_active: true,
        created_by: userId,
        ...normalized,
      })
      .select('*')
      .single()

    if (error) return failure(res, error.message, 400)

    return success(res, { planVersion: data }, 201)
  } catch (error) {
    req.log?.error({ err: error, ...userIdFromReq(req), event: 'nutrition.plan_version_create_error' }, 'nutrition')
    return failure(res, 'Failed to create nutrition plan version', 500)
  }
}

async function upsertProgressLog(req, res) {
  try {
    req.log?.info({ ...userIdFromReq(req), event: 'nutrition.progress_upsert' }, 'nutrition')
    const supabase = createUserClient(req.accessToken)
    const userId = req.user.id

    const payload = normalizeProgressPayload(req.body || {})
    if (!payload.log_date) {
      return failure(res, 'logDate is required')
    }

    const { data, error } = await supabase
      .from('nutrition_progress_logs')
      .upsert({ user_id: userId, ...payload }, { onConflict: 'user_id,log_date' })
      .select('*')
      .single()

    if (error) return failure(res, error.message, 400)

    return success(res, { progressLog: data })
  } catch (error) {
    req.log?.error({ err: error, ...userIdFromReq(req), event: 'nutrition.progress_upsert_error' }, 'nutrition')
    return failure(res, 'Failed to upsert nutrition progress log', 500)
  }
}

async function listProgressLogs(req, res) {
  try {
    req.log?.debug({ ...userIdFromReq(req), event: 'nutrition.progress_list' }, 'nutrition')
    const supabase = createUserClient(req.accessToken)
    const userId = req.user.id

    const limitRaw = Number.parseInt(String(req.query.limit || '30'), 10)
    const limit = Number.isNaN(limitRaw) ? 30 : Math.min(Math.max(limitRaw, 1), 365)

    let query = supabase
      .from('nutrition_progress_logs')
      .select('*')
      .eq('user_id', userId)
      .order('log_date', { ascending: false })
      .limit(limit)

    if (typeof req.query.from === 'string' && req.query.from) {
      query = query.gte('log_date', req.query.from)
    }

    if (typeof req.query.to === 'string' && req.query.to) {
      query = query.lte('log_date', req.query.to)
    }

    const { data, error } = await query

    if (error) return failure(res, error.message, 400)

    return success(res, { progressLogs: data || [] })
  } catch (error) {
    req.log?.error({ err: error, ...userIdFromReq(req), event: 'nutrition.progress_list_error' }, 'nutrition')
    return failure(res, 'Failed to list nutrition progress logs', 500)
  }
}

async function calculatePlanPreview(req, res) {
  try {
    req.log?.debug({ ...userIdFromReq(req), event: 'nutrition.preview' }, 'nutrition')
    const profile = {
      weight: req.body?.weight,
      height: req.body?.height,
      age: req.body?.age,
      gender: req.body?.gender,
      activityLevel: req.body?.activityLevel,
      goal: req.body?.goal,
      mealCount: req.body?.mealCount,
    }

    const plan = calculateNutritionPlan(profile)
    return success(res, { plan })
  } catch (error) {
    req.log?.warn({ err: error, ...userIdFromReq(req), event: 'nutrition.preview_error' }, 'nutrition')
    return failure(res, error.message || 'Failed to calculate nutrition plan', 400)
  }
}

module.exports = {
  getNutritionSummary,
  upsertNutritionProfile,
  listPlanVersions,
  createPlanVersion,
  upsertProgressLog,
  listProgressLogs,
  calculatePlanPreview,
}
