const { supabaseAdmin } = require('../config/supabase')
const { getNutritionDistribution } = require('../utils/nutritionCalculator')

const DAYS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']
const DAILY_TYPES = ['Desayuno', 'Snack Mañana', 'Comida', 'Snack Tarde', 'Cena']
const SLOT_HOURS = {
  Desayuno: '08:30',
  'Snack Mañana': '10:45',
  Comida: '14:30',
  'Snack Tarde': '17:45',
  Cena: '19:45',
}

const WEEKLY_SLOTS = DAYS.flatMap((day) =>
  DAILY_TYPES.map((tipo) => ({
    slotId: `${day.toLowerCase()}-${tipo.toLowerCase().replace(/\s+/g, '-')}`,
    day,
    tipo,
    hour: SLOT_HOURS[tipo],
  }))
)

const DEFAULT_DISTRIBUTION_BY_MEAL = {
  breakfast: 25,
  snackAm: 10,
  lunch: 30,
  snackPm: 10,
  dinner: 25,
}

const GROUP_GRAMS_PER_PORTION = {
  verduras: 75,
  frutas: 120,
  cereales_tuberculos: 25,
  leguminosas: 35,
  proteina_animal_o_alternativas: 30,
  lacteos_o_sustitutos: 240,
  grasas_saludables: 5,
}

const GROUP_TO_BASE_INGREDIENT = {
  verduras: 'espinaca',
  frutas: 'manzana',
  cereales_tuberculos: 'arroz',
  leguminosas: 'frijol',
  proteina_animal_o_alternativas: 'pollo',
  lacteos_o_sustitutos: 'yogurt',
  grasas_saludables: 'aguacate',
}

const INGREDIENT_GROUP_MAP = {
  aceite: 'grasas_saludables',
  aguacate: 'grasas_saludables',
  arroz: 'cereales_tuberculos',
  avena: 'cereales_tuberculos',
  calabacita: 'verduras',
  caldo: 'verduras',
  cebolla: 'verduras',
  chia: 'grasas_saludables',
  espinaca: 'verduras',
  frijol: 'leguminosas',
  huevo: 'proteina_animal_o_alternativas',
  jicama: 'verduras',
  jitomate: 'verduras',
  'leche de avena': 'lacteos_o_sustitutos',
  lechuga: 'verduras',
  lenteja: 'leguminosas',
  manzana: 'frutas',
  nopal: 'verduras',
  pan: 'cereales_tuberculos',
  papa: 'cereales_tuberculos',
  papaya: 'frutas',
  pavo: 'proteina_animal_o_alternativas',
  pepino: 'verduras',
  pera: 'frutas',
  platano: 'frutas',
  pollo: 'proteina_animal_o_alternativas',
  res: 'proteina_animal_o_alternativas',
  tortilla: 'cereales_tuberculos',
  yogurt: 'lacteos_o_sustitutos',
  zanahoria: 'verduras',
}

function normalizeIngredientId(value) {
  return String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function ingredientGroupById(ingredientId) {
  return INGREDIENT_GROUP_MAP[normalizeIngredientId(ingredientId)] || null
}

function distributionKeyFromTipo(tipo) {
  if (tipo === 'Desayuno') return 'breakfast'
  if (tipo === 'Snack Mañana') return 'snackAm'
  if (tipo === 'Comida') return 'lunch'
  if (tipo === 'Snack Tarde') return 'snackPm'
  return 'dinner'
}

function tipoFromDistributionKey(key) {
  if (key === 'breakfast') return 'Desayuno'
  if (key === 'snackAm') return 'Snack Mañana'
  if (key === 'lunch') return 'Comida'
  if (key === 'snackPm') return 'Snack Tarde'
  return 'Cena'
}

function profileGoalToCalculatorGoal(objectiveGoal) {
  const map = {
    weight_loss: 'lose',
    rapid_weight_loss: 'loseFast',
    weight_maintenance: 'maintain',
    muscle_gain: 'muscle',
    weight_gain: 'gain',
    endurance_improvement: 'endurance',
    healthy_diet: 'healthy',
  }

  return map[objectiveGoal] || 'healthy'
}

function roundToOne(value) {
  return Math.round(value * 10) / 10
}

function toFiniteNumber(value, fallback = 0) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

function normalizeDistribution(raw) {
  const merged = {
    breakfast: toFiniteNumber(raw?.breakfast, DEFAULT_DISTRIBUTION_BY_MEAL.breakfast),
    snackAm: toFiniteNumber(raw?.snackAm, DEFAULT_DISTRIBUTION_BY_MEAL.snackAm),
    lunch: toFiniteNumber(raw?.lunch, DEFAULT_DISTRIBUTION_BY_MEAL.lunch),
    snackPm: toFiniteNumber(raw?.snackPm, DEFAULT_DISTRIBUTION_BY_MEAL.snackPm),
    dinner: toFiniteNumber(raw?.dinner, DEFAULT_DISTRIBUTION_BY_MEAL.dinner),
  }

  const total = Object.values(merged).reduce((acc, value) => acc + Math.max(0, value), 0)
  if (total <= 0) {
    return {
      breakfast: 0.25,
      snackAm: 0.1,
      lunch: 0.3,
      snackPm: 0.1,
      dinner: 0.25,
    }
  }

  return {
    breakfast: Math.max(0, merged.breakfast) / total,
    snackAm: Math.max(0, merged.snackAm) / total,
    lunch: Math.max(0, merged.lunch) / total,
    snackPm: Math.max(0, merged.snackPm) / total,
    dinner: Math.max(0, merged.dinner) / total,
  }
}

function buildMealGroupGrams(portionsByGroup, distributionByMeal, options = {}) {
  const goal = options.goal || 'healthy'
  const mealCount = [3, 4, 5].includes(Number(options.mealCount)) ? Number(options.mealCount) : 5
  const { foodGroups } = getNutritionDistribution({ goal, mealCount })

  const groupKeyMap = {
    verduras: 'verduras',
    frutas: 'frutas',
    cereales_tuberculos: 'cerealesYTuberculos',
    leguminosas: 'leguminosas',
    proteina_animal_o_alternativas: 'proteina',
    lacteos_o_sustitutos: 'lacteos',
    grasas_saludables: null,
  }

  const keys = ['breakfast', 'snackAm', 'lunch', 'snackPm', 'dinner']
  const result = {
    breakfast: {},
    snackAm: {},
    lunch: {},
    snackPm: {},
    dinner: {},
  }

  for (const group of Object.keys(GROUP_GRAMS_PER_PORTION)) {
    const dailyPortions = toFiniteNumber(portionsByGroup?.[group], 0)
    const dailyGrams = dailyPortions * GROUP_GRAMS_PER_PORTION[group]

    const mappedGroup = groupKeyMap[group]
    const rawShares = keys.map((key) => {
      const tipo = tipoFromDistributionKey(key)
      const mealPercent = toFiniteNumber(distributionByMeal?.[key], 0)

      if (!mappedGroup) {
        return mealPercent
      }

      const groupPercent = toFiniteNumber(foodGroups?.[tipo]?.[mappedGroup], 0)
      return mealPercent * groupPercent
    })

    let sumShares = rawShares.reduce((acc, value) => acc + Math.max(0, value), 0)
    let shares = rawShares

    // For groups with zero shares (e.g. not modeled), fallback to meal distribution.
    if (sumShares <= 0) {
      shares = keys.map((key) => toFiniteNumber(distributionByMeal?.[key], 0))
      sumShares = shares.reduce((acc, value) => acc + Math.max(0, value), 0)
    }

    const gramsByMeal = {
      breakfast: 0,
      snackAm: 0,
      lunch: 0,
      snackPm: 0,
      dinner: 0,
    }

    if (dailyGrams > 0 && sumShares > 0) {
      keys.forEach((key, idx) => {
        gramsByMeal[key] = (dailyGrams * Math.max(0, shares[idx])) / sumShares
      })
    }

    keys.forEach((key) => {
      result[key][group] = gramsByMeal[key]
    })
  }

  return result
}

function buildGeneratedMeal({ userId, week, day, tipo, slotId, groupGramsByMeal }) {
  const ingredients = Object.keys(GROUP_GRAMS_PER_PORTION)
    .map((group) => {
      const rawGrams = toFiniteNumber(groupGramsByMeal?.[group], 0)
      const mealGrams = rawGrams > 0 ? Math.max(1, Math.round(rawGrams)) : 0
      if (mealGrams <= 0) return null

      return {
        id: GROUP_TO_BASE_INGREDIENT[group],
        presentacion: `Porción calculada (${group})`,
        cantidad: mealGrams,
        unidad: 'g',
      }
    })
    .filter(Boolean)

  return {
    id: `plan-${userId}-${week}-${slotId}`,
    tipo,
    nombre: `${tipo} - Plan personalizado`,
    receta: `Comida generada automáticamente para ${day} con base en porciones del plan activo.`,
    tip: 'Ajusta porciones con el panel de nutrición para recalcular automáticamente.',
    tags: ['plan-personalizado', 'auto-generado'],
    forbidden_ingredients: [],
    ingredientes: ingredients,
  }
}

function toCatalogMealPayload(row) {
  if (!row) return null

  return {
    id: row.id,
    tipo: row.tipo,
    nombre: row.nombre,
    receta: row.receta || '',
    tip: row.tip || '',
    tags: Array.isArray(row.tags) ? row.tags : [],
    forbidden_ingredients: Array.isArray(row.forbidden_ingredients) ? row.forbidden_ingredients : [],
    ingredientes: Array.isArray(row.ingredientes) ? row.ingredientes : [],
    groupPortions: row.group_portions && typeof row.group_portions === 'object' ? row.group_portions : {},
    realDishMetadata: row.real_dish_metadata && typeof row.real_dish_metadata === 'object' ? row.real_dish_metadata : {},
  }
}

function success(res, data, status = 200) {
  return res.status(status).json({ ok: true, data })
}

function failure(res, error, status = 400) {
  return res.status(status).json({ ok: false, error })
}

function normalizeJsonObject(value) {
  return value && typeof value === 'object' && !Array.isArray(value) ? value : {}
}

function normalizeJsonArray(value) {
  return Array.isArray(value) ? value : []
}

function normalizeSuggestionPreferences(value) {
  const preferences = normalizeJsonObject(value)

  return {
    preferredCuisineTags: Array.isArray(preferences.preferredCuisineTags)
      ? preferences.preferredCuisineTags.filter((item) => typeof item === 'string')
      : [],
    preferQuickMeals: Boolean(preferences.preferQuickMeals),
    avoidFish: Boolean(preferences.avoidFish),
    preferMeasuredMeals:
      typeof preferences.preferMeasuredMeals === 'boolean'
        ? preferences.preferMeasuredMeals
        : typeof preferences.preferCurated === 'boolean'
          ? preferences.preferCurated
          : true,
    autoApplyToGeneratedWeek:
      typeof preferences.autoApplyToGeneratedWeek === 'boolean'
        ? preferences.autoApplyToGeneratedWeek
        : true,
  }
}

function buildMealOverridesBySlot(slotRows) {
  return (slotRows || []).reduce((acc, slot) => {
    if (slot.meal_override_payload && typeof slot.meal_override_payload === 'object' && !Array.isArray(slot.meal_override_payload)) {
      acc[slot.slot_id] = slot.meal_override_payload
    }
    return acc
  }, {})
}

function buildIngredientMultipliersBySlot(slotRows) {
  return (slotRows || []).reduce((acc, slot) => {
    const multipliers = normalizeJsonObject(slot.ingredient_multipliers)
    for (const [key, value] of Object.entries(multipliers)) {
      if (typeof value === 'number' && Number.isFinite(value) && value >= 0) {
        acc[key] = value
      }
    }
    return acc
  }, {})
}

function buildIngredientMultiplierPayloadForSlot(slotId, allMultipliers) {
  const payload = {}
  const prefix = `${slotId}::`

  for (const [key, value] of Object.entries(normalizeJsonObject(allMultipliers))) {
    if (!key.startsWith(prefix)) continue
    if (typeof value === 'number' && Number.isFinite(value) && value >= 0) {
      payload[key] = value
    }
  }

  return payload
}

function normalizeWeekPlan(weekRow, slotRows) {
  if (!weekRow) return null

  const gs = normalizeJsonObject(weekRow.grocery_state)

  return {
    id: weekRow.id,
    userId: weekRow.user_id,
    week: weekRow.week,
    groceryState: {
      checked: Array.isArray(gs.checked) ? gs.checked : [],
      onlyPending: Boolean(gs.onlyPending),
    },
    weekState: {
      mealOverrides: buildMealOverridesBySlot(slotRows),
      ingredientMultipliers: buildIngredientMultipliersBySlot(slotRows),
      groceryAdjustments: normalizeJsonArray(weekRow.grocery_adjustments),
      suggestionPreferences: normalizeSuggestionPreferences(weekRow.suggestion_preferences),
    },
    updatedAt: weekRow.updated_at,
    slots: (slotRows || []).map((slot) => ({
      id: slot.id,
      slot: slot.slot_id,
      day: slot.day,
      tipo: slot.tipo,
      hour: slot.hour,
      mealId: slot.meal_payload?.id || null,
      meal: slot.meal_payload || null,
      completed: Boolean(slot.completed),
      updatedAt: slot.updated_at,
    })),
  }
}

function getIsoWeekString(date = new Date()) {
  const target = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const dayNum = target.getUTCDay() || 7
  target.setUTCDate(target.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(target.getUTCFullYear(), 0, 1))
  const weekNum = Math.ceil((((target - yearStart) / 86400000) + 1) / 7)

  return `${target.getUTCFullYear()}-W${String(weekNum).padStart(2, '0')}`
}

async function ensureAdmin(userId) {
  const { data, error } = await supabaseAdmin
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .single()

  if (error || !data || data.role !== 'admin') {
    return false
  }

  return true
}

async function ensureSharedReadAccess(ownerUserId, requesterUserId) {
  if (ownerUserId === requesterUserId) return true

  if (await ensureAdmin(requesterUserId)) return true

  const { data, error } = await supabaseAdmin
    .from('plan_shares')
    .select('owner_user_id')
    .eq('owner_user_id', ownerUserId)
    .eq('shared_with_user_id', requesterUserId)
    .maybeSingle()

  if (error) return false

  return Boolean(data)
}

async function getWeekRow(userId, week) {
  const { data, error } = await supabaseAdmin
    .from('meal_plan_weeks')
    .select('*')
    .eq('user_id', userId)
    .eq('week', week)
    .maybeSingle()

  if (error) {
    throw new Error(error.message)
  }

  return data || null
}

async function getSlotsByWeekId(weekId) {
  const { data, error } = await supabaseAdmin
    .from('meal_plan_slots')
    .select('*')
    .eq('week_id', weekId)
    .order('day', { ascending: true })
    .order('hour', { ascending: true })

  if (error) {
    throw new Error(error.message)
  }

  return data || []
}

async function getProfilesByIds(userIds) {
  const ids = [...new Set((userIds || []).filter(Boolean))]
  if (ids.length === 0) return []

  const { data, error } = await supabaseAdmin
    .from('profiles')
    .select('id, name, role, nutritional_profile, created_at')
    .in('id', ids)

  if (error) {
    throw new Error(error.message)
  }

  return data || []
}

async function ensureWeekRow(userId, week) {
  const existing = await getWeekRow(userId, week)
  if (existing) return existing

  const { data, error } = await supabaseAdmin
    .from('meal_plan_weeks')
    .insert({
      user_id: userId,
      week,
      grocery_state: {},
      grocery_adjustments: [],
      suggestion_preferences: {},
    })
    .select('*')
    .single()

  if (error) {
    throw new Error(error.message)
  }

  return data
}

async function getMyPlan(req, res) {
  try {
    const week = req.query.week || getIsoWeekString()
    const weekRow = await getWeekRow(req.user.id, week)

    if (!weekRow) {
      return success(res, { plan: null })
    }

    const slots = await getSlotsByWeekId(weekRow.id)
    return success(res, { plan: normalizeWeekPlan(weekRow, slots) })
  } catch (error) {
    return failure(res, 'Failed to fetch meal plan', 500)
  }
}

async function generateMyPlan(req, res) {
  try {
    const week = req.body?.week || getIsoWeekString()

    // Require an active nutrition plan version with portions set.
    const [
      { data: activePlan, error: planError },
      { data: nutritionProfile, error: profileError },
    ] = await Promise.all([
      supabaseAdmin
        .from('nutrition_plan_versions')
        .select('portions_by_group, distribution_by_meal')
        .eq('user_id', req.user.id)
        .eq('is_active', true)
        .order('version_number', { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabaseAdmin
        .from('nutrition_profiles')
        .select('objective_goal, meals_per_day')
        .eq('user_id', req.user.id)
        .maybeSingle(),
    ])

    if (planError) {
      return failure(res, planError.message, 400)
    }

    if (profileError) {
      return failure(res, profileError.message, 400)
    }

    if (!activePlan?.portions_by_group) {
      return failure(
        res,
        'Completa tu perfil nutricional y guarda un plan con porciones antes de generar tu dieta.',
        400
      )
    }

    const portionsByGroup = activePlan.portions_by_group || {}
    const distribution = normalizeDistribution(activePlan.distribution_by_meal || {})
    const goal = profileGoalToCalculatorGoal(nutritionProfile?.objective_goal)
    const mealCount = Math.max(3, Math.min(5, toFiniteNumber(nutritionProfile?.meals_per_day, 5)))
    const mealGroupGramsByKey = buildMealGroupGrams(portionsByGroup, distribution, { goal, mealCount })

    const slots = DAYS.flatMap((day) =>
      DAILY_TYPES.map((tipo) => {
        const slotId = `${day.toLowerCase()}-${tipo.toLowerCase().replace(/\s+/g, '-')}`
        const distributionKey = distributionKeyFromTipo(tipo)
        const mealPayload = buildGeneratedMeal({
          userId: req.user.id,
          week,
          day,
          tipo,
          slotId,
          groupGramsByMeal: mealGroupGramsByKey[distributionKey],
        })

        return {
          slot: slotId,
          day,
          tipo,
          hour: SLOT_HOURS[tipo],
          mealPayload,
          completed: false,
        }
      })
    )

    const weekRow = await ensureWeekRow(req.user.id, week)

    const { error: deleteError } = await supabaseAdmin
      .from('meal_plan_slots')
      .delete()
      .eq('week_id', weekRow.id)

    if (deleteError) {
      return failure(res, deleteError.message, 400)
    }

    const rowsToInsert = slots.map((slot) => ({
      week_id: weekRow.id,
      slot_id: slot.slot,
      day: slot.day,
      tipo: slot.tipo,
      hour: slot.hour,
      meal_payload: slot.mealPayload,
      meal_override_payload: null,
      ingredient_multipliers: {},
      completed: false,
    }))

    const { data: insertedSlots, error: insertError } = await supabaseAdmin
      .from('meal_plan_slots')
      .insert(rowsToInsert)
      .select('*')

    if (insertError) {
      return failure(res, insertError.message, 400)
    }

    return success(res, { plan: normalizeWeekPlan(weekRow, insertedSlots || []) })
  } catch (error) {
    return failure(res, 'Failed to generate meal plan', 500)
  }
}

async function updateMyWeekState(req, res) {
  try {
    const { mealOverrides, ingredientMultipliers, groceryAdjustments, suggestionPreferences, week } = req.body || {}

    const selectedWeek = week || getIsoWeekString()
    const weekRow = await ensureWeekRow(req.user.id, selectedWeek)

    if (groceryAdjustments !== undefined || suggestionPreferences !== undefined) {
      const weekUpdatePayload = {}

      if (groceryAdjustments !== undefined) {
        weekUpdatePayload.grocery_adjustments = normalizeJsonArray(groceryAdjustments)
      }

      if (suggestionPreferences !== undefined) {
        weekUpdatePayload.suggestion_preferences = normalizeSuggestionPreferences(suggestionPreferences)
      }

      const { error: weekError } = await supabaseAdmin
        .from('meal_plan_weeks')
        .update(weekUpdatePayload)
        .eq('id', weekRow.id)

      if (weekError) {
        return failure(res, weekError.message, 400)
      }
    }

    if (mealOverrides !== undefined || ingredientMultipliers !== undefined) {
      const slots = await getSlotsByWeekId(weekRow.id)

      const slotUpdates = slots.map((slot) => {
        const updatePayload = {}

        if (mealOverrides !== undefined) {
          const overridesMap = normalizeJsonObject(mealOverrides)
          updatePayload.meal_override_payload = overridesMap[slot.slot_id] || null
        }

        if (ingredientMultipliers !== undefined) {
          updatePayload.ingredient_multipliers = buildIngredientMultiplierPayloadForSlot(
            slot.slot_id,
            ingredientMultipliers
          )
        }

        if (Object.keys(updatePayload).length === 0) {
          return Promise.resolve({ error: null })
        }

        return supabaseAdmin
          .from('meal_plan_slots')
          .update(updatePayload)
          .eq('id', slot.id)
      })

      const results = await Promise.all(slotUpdates)
      const failed = results.find((result) => result.error)
      if (failed?.error) {
        return failure(res, failed.error.message, 400)
      }
    }

    const refreshedWeekRow = await getWeekRow(req.user.id, selectedWeek)
    const refreshedSlots = await getSlotsByWeekId(weekRow.id)
    return success(res, { plan: normalizeWeekPlan(refreshedWeekRow, refreshedSlots) })
  } catch (error) {
    return failure(res, 'Failed to update week state', 500)
  }
}

async function updateMySlot(req, res) {
  try {
    return failure(
      res,
      'Intercambio manual de comidas deshabilitado. Regenera la semana desde el plan de porciones.',
      400
    )
  } catch (error) {
    return failure(res, 'Failed to update slot', 500)
  }
}

async function getMySlotAlternatives(req, res) {
  try {
    const { slotId, currentMealId, week } = req.body || {}

    if (!slotId || typeof slotId !== 'string') {
      return failure(res, 'slotId is required', 400)
    }

    const selectedWeek = week || getIsoWeekString()
    const weekRow = await getWeekRow(req.user.id, selectedWeek)
    if (!weekRow) {
      return failure(res, 'Plan not found for selected week', 404)
    }

    const { data: slotRow, error: slotError } = await supabaseAdmin
      .from('meal_plan_slots')
      .select('slot_id, tipo')
      .eq('week_id', weekRow.id)
      .eq('slot_id', slotId)
      .maybeSingle()

    if (slotError) {
      return failure(res, slotError.message, 400)
    }

    if (!slotRow) {
      return failure(res, 'Slot not found in current plan', 404)
    }

    let query = supabaseAdmin
      .from('meals')
      .select('id, tipo, nombre, receta, tip, tags, forbidden_ingredients, ingredientes, group_portions, real_dish_metadata')
      .eq('tipo', slotRow.tipo)
      .order('nombre', { ascending: true })

    if (currentMealId && typeof currentMealId === 'string') {
      query = query.neq('id', currentMealId)
    }

    const { data: meals, error: mealsError } = await query

    if (mealsError) {
      return failure(res, mealsError.message, 400)
    }

    return success(res, {
      slotId,
      currentMealId: currentMealId || null,
      suggestedMeals: (meals || []).map(toCatalogMealPayload),
    })
  } catch (error) {
    return failure(res, 'Failed to fetch slot alternatives', 500)
  }
}

async function replaceMySlotIngredient(req, res) {
  try {
    const { slot, ingredientIndex, nextIngredientId, week } = req.body || {}

    if (!slot || typeof ingredientIndex !== 'number' || !nextIngredientId) {
      return failure(res, 'slot, ingredientIndex(number) and nextIngredientId are required')
    }

    const selectedWeek = week || getIsoWeekString()
    const weekRow = await getWeekRow(req.user.id, selectedWeek)
    if (!weekRow) {
      return failure(res, 'Plan not found for selected week', 404)
    }

    const { data: slotRow, error: slotError } = await supabaseAdmin
      .from('meal_plan_slots')
      .select('*')
      .eq('week_id', weekRow.id)
      .eq('slot_id', slot)
      .maybeSingle()

    if (slotError) {
      return failure(res, slotError.message, 400)
    }

    if (!slotRow) {
      return failure(res, 'Slot not found in current plan', 404)
    }

    const mealPayload = slotRow.meal_payload
    if (!mealPayload || typeof mealPayload !== 'object') {
      return failure(res, 'Slot has no generated meal payload', 400)
    }

    const ingredients = Array.isArray(mealPayload.ingredientes) ? [...mealPayload.ingredientes] : []
    if (ingredientIndex < 0 || ingredientIndex >= ingredients.length) {
      return failure(res, 'ingredientIndex out of range', 400)
    }

    const currentIngredient = ingredients[ingredientIndex]
    const currentId = normalizeIngredientId(currentIngredient?.id)
    const nextId = normalizeIngredientId(nextIngredientId)

    const currentGroup = ingredientGroupById(currentId)
    const nextGroup = ingredientGroupById(nextId)

    if (!currentGroup || !nextGroup || currentGroup !== nextGroup) {
      return failure(res, 'Ingredient replacement must stay within the same food group', 400)
    }

    ingredients[ingredientIndex] = {
      ...currentIngredient,
      id: nextId,
    }

    const nextMealPayload = {
      ...mealPayload,
      ingredientes: ingredients,
    }

    const { error: updateError } = await supabaseAdmin
      .from('meal_plan_slots')
      .update({
        meal_payload: nextMealPayload,
      })
      .eq('id', slotRow.id)

    if (updateError) {
      return failure(res, updateError.message, 400)
    }

    const slots = await getSlotsByWeekId(weekRow.id)
    return success(res, { plan: normalizeWeekPlan(weekRow, slots) })
  } catch (error) {
    return failure(res, 'Failed to replace ingredient', 500)
  }
}

async function completeMySlot(req, res) {
  try {
    const { slot, completed, week } = req.body || {}

    if (!slot || typeof completed !== 'boolean') {
      return failure(res, 'slot and completed(boolean) are required')
    }

    const selectedWeek = week || getIsoWeekString()

    const weekRow = await getWeekRow(req.user.id, selectedWeek)
    if (!weekRow) {
      return failure(res, 'Plan not found for selected week', 404)
    }

    const { data, error } = await supabaseAdmin
      .from('meal_plan_slots')
      .update({
        completed,
      })
      .eq('week_id', weekRow.id)
      .eq('slot_id', slot)
      .select('*')
      .maybeSingle()

    if (error) {
      return failure(res, error.message, 400)
    }

    if (!data) {
      return failure(res, 'Slot not found in current plan', 404)
    }

    const slots = await getSlotsByWeekId(weekRow.id)
    return success(res, { plan: normalizeWeekPlan(weekRow, slots) })
  } catch (error) {
    return failure(res, 'Failed to complete slot', 500)
  }
}

async function updateMyGrocery(req, res) {
  try {
    const { groceryState, week } = req.body || {}

    if (groceryState === undefined) {
      return failure(res, 'groceryState is required')
    }

    const selectedWeek = week || getIsoWeekString()

    const weekRow = await ensureWeekRow(req.user.id, selectedWeek)

    const { data, error } = await supabaseAdmin
      .from('meal_plan_weeks')
      .update({
        grocery_state: groceryState,
      })
      .eq('id', weekRow.id)
      .select('*')
      .single()

    if (error) {
      return failure(res, error.message, 400)
    }

    const slots = await getSlotsByWeekId(weekRow.id)
    return success(res, { plan: normalizeWeekPlan(data, slots) })
  } catch (error) {
    return failure(res, 'Failed to update grocery state', 500)
  }
}

async function getUserPlan(req, res) {
  try {
    if (!(await ensureAdmin(req.user.id))) {
      return failure(res, 'Admin access required', 403)
    }

    const { userId } = req.params
    const week = req.query.week || getIsoWeekString()

    const weekRow = await getWeekRow(userId, week)
    if (!weekRow) {
      return success(res, { plan: null })
    }

    const slots = await getSlotsByWeekId(weekRow.id)
    return success(res, { plan: normalizeWeekPlan(weekRow, slots) })
  } catch (error) {
    return failure(res, 'Failed to fetch user plan', 500)
  }
}

async function getCombinedPlan(req, res) {
  try {
    const { otherUserId } = req.params
    const week = req.query.week || getIsoWeekString()

    const canReadOther = await ensureSharedReadAccess(otherUserId, req.user.id)
    if (!canReadOther) {
      return failure(res, 'Not allowed to read selected user plan', 403)
    }

    const [mineWeek, otherWeek] = await Promise.all([
      getWeekRow(req.user.id, week),
      getWeekRow(otherUserId, week),
    ])

    const [mineSlotsRaw, otherSlotsRaw] = await Promise.all([
      mineWeek ? getSlotsByWeekId(mineWeek.id) : Promise.resolve([]),
      otherWeek ? getSlotsByWeekId(otherWeek.id) : Promise.resolve([]),
    ])

    const profiles = await getProfilesByIds([req.user.id, otherUserId])
    const mineSlots = mineSlotsRaw
    const otherSlots = otherSlotsRaw

    const profilesById = new Map((profiles || []).map((item) => [item.id, item]))

    const mergedMap = new Map()

    const assignSlot = (slot, owner) => {
      const key = slot.slot_id
      const existing = mergedMap.get(key) || {
        slot: key,
        day: slot.day,
        tipo: slot.tipo,
        hour: slot.hour,
        users: {},
      }

      existing.users[owner] = {
        mealId: slot.meal_payload?.id || null,
        meal: slot.meal_payload || null,
        completed: Boolean(slot.completed),
      }

      mergedMap.set(key, existing)
    }

    mineSlots.forEach((slot) => assignSlot(slot, req.user.id))
    otherSlots.forEach((slot) => assignSlot(slot, otherUserId))

    const combinedSlots = [...mergedMap.values()].sort((a, b) => {
      if (a.day === b.day) return a.hour.localeCompare(b.hour)
      return DAYS.indexOf(a.day) - DAYS.indexOf(b.day)
    })

    return success(res, {
      week,
      users: [req.user.id, otherUserId],
      profiles: {
        mine: profilesById.get(req.user.id) || null,
        other: profilesById.get(otherUserId) || null,
      },
      plans: {
        mine: normalizeWeekPlan(mineWeek, mineSlots),
        other: normalizeWeekPlan(otherWeek, otherSlots),
      },
      combinedSlots,
    })
  } catch (error) {
    return failure(res, 'Failed to fetch combined plan', 500)
  }
}

module.exports = {
  getMyPlan,
  generateMyPlan,
  getMySlotAlternatives,
  updateMySlot,
  replaceMySlotIngredient,
  completeMySlot,
  updateMyGrocery,
  updateMyWeekState,
  getUserPlan,
  getCombinedPlan,
}
