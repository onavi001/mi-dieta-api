const ACTIVITY_LEVELS = {
  sedentary: { label: 'Sedentario', factor: 1.2 },
  light: { label: 'Ligeramente activo', factor: 1.375 },
  moderate: { label: 'Moderadamente activo', factor: 1.55 },
  active: { label: 'Muy activo', factor: 1.725 },
}

const GOALS = {
  lose: { label: 'Perder peso', adjustment: -500 },
  loseFast: { label: 'Perder peso rápido', adjustment: -750 },
  maintain: { label: 'Mantener peso', adjustment: 0 },
  muscle: { label: 'Ganar músculo', adjustment: 250 },
  gain: { label: 'Ganar peso', adjustment: 500 },
  endurance: { label: 'Mejorar resistencia', adjustment: 100 },
  healthy: { label: 'Dieta saludable', adjustment: 0 },
}

const MACRO_RATIOS = {
  lose: { protein: 0.35, carbs: 0.35, fat: 0.3 },
  loseFast: { protein: 0.4, carbs: 0.3, fat: 0.3 },
  maintain: { protein: 0.25, carbs: 0.5, fat: 0.25 },
  muscle: { protein: 0.3, carbs: 0.5, fat: 0.2 },
  gain: { protein: 0.2, carbs: 0.55, fat: 0.25 },
  endurance: { protein: 0.2, carbs: 0.6, fat: 0.2 },
  healthy: { protein: 0.25, carbs: 0.5, fat: 0.25 },
}

const MIN_CALORIES = {
  male: 1500,
  female: 1200,
}

const MEAL_DISTRIBUTION = {
  3: {
    Desayuno: 0.3,
    Comida: 0.4,
    Cena: 0.3,
  },
  4: {
    Desayuno: 0.25,
    Comida: 0.35,
    'Snack Tarde': 0.1,
    Cena: 0.3,
  },
  5: {
    Desayuno: 0.25,
    'Snack Mañana': 0.1,
    Comida: 0.3,
    'Snack Tarde': 0.1,
    Cena: 0.25,
  },
}

const FOOD_GROUP_BASE = {
  3: {
    Desayuno: {
      verduras: 0,
      frutas: 0.2,
      cerealesYTuberculos: 0.45,
      leguminosas: 0,
      proteina: 0.2,
      lacteos: 0.15,
    },
    Comida: {
      verduras: 0.35,
      frutas: 0,
      cerealesYTuberculos: 0.25,
      leguminosas: 0.2,
      proteina: 0.2,
      lacteos: 0,
    },
    Cena: {
      verduras: 0.4,
      frutas: 0,
      cerealesYTuberculos: 0.15,
      leguminosas: 0.15,
      proteina: 0.3,
      lacteos: 0,
    },
  },
  4: {
    Desayuno: {
      verduras: 0,
      frutas: 0.2,
      cerealesYTuberculos: 0.4,
      leguminosas: 0,
      proteina: 0.25,
      lacteos: 0.15,
    },
    Comida: {
      verduras: 0.35,
      frutas: 0,
      cerealesYTuberculos: 0.25,
      leguminosas: 0.2,
      proteina: 0.2,
      lacteos: 0,
    },
    'Snack Tarde': {
      verduras: 0,
      frutas: 0.6,
      cerealesYTuberculos: 0,
      leguminosas: 0,
      proteina: 0,
      lacteos: 0.4,
    },
    Cena: {
      verduras: 0.4,
      frutas: 0,
      cerealesYTuberculos: 0.15,
      leguminosas: 0.15,
      proteina: 0.3,
      lacteos: 0,
    },
  },
  5: {
    Desayuno: {
      verduras: 0,
      frutas: 0.25,
      cerealesYTuberculos: 0.4,
      leguminosas: 0,
      proteina: 0.2,
      lacteos: 0.15,
    },
    'Snack Mañana': {
      verduras: 0,
      frutas: 0.6,
      cerealesYTuberculos: 0,
      leguminosas: 0,
      proteina: 0,
      lacteos: 0.4,
    },
    Comida: {
      verduras: 0.35,
      frutas: 0,
      cerealesYTuberculos: 0.25,
      leguminosas: 0.2,
      proteina: 0.2,
      lacteos: 0,
    },
    'Snack Tarde': {
      verduras: 0,
      frutas: 0.6,
      cerealesYTuberculos: 0,
      leguminosas: 0,
      proteina: 0,
      lacteos: 0.4,
    },
    Cena: {
      verduras: 0.4,
      frutas: 0,
      cerealesYTuberculos: 0.15,
      leguminosas: 0.15,
      proteina: 0.3,
      lacteos: 0,
    },
  },
}

const GOAL_FOOD_GROUP_ADJUSTMENTS = {
  lose: {
    Comida: { verduras: 0.05, cerealesYTuberculos: -0.05 },
    Cena: { verduras: 0.05, cerealesYTuberculos: -0.05 },
  },
  loseFast: {
    Comida: { verduras: 0.05, cerealesYTuberculos: -0.05 },
    Cena: { verduras: 0.05, cerealesYTuberculos: -0.05 },
  },
  maintain: {},
  muscle: {
    Desayuno: { proteina: 0.05, lacteos: -0.05 },
    Comida: { proteina: 0.05, leguminosas: -0.05 },
    Cena: { proteina: 0.05, verduras: -0.05 },
  },
  gain: {
    Desayuno: { cerealesYTuberculos: 0.05, frutas: -0.05 },
    Comida: { cerealesYTuberculos: 0.05, verduras: -0.05 },
  },
  endurance: {
    Desayuno: { cerealesYTuberculos: 0.1, proteina: -0.05, lacteos: -0.05 },
    Comida: { cerealesYTuberculos: 0.1, proteina: -0.05, leguminosas: -0.05 },
  },
  healthy: {},
}

function roundTo(value, decimals = 2) {
  const factor = 10 ** decimals
  return Math.round(value * factor) / factor
}

function normalizeGender(gender) {
  return String(gender || '').toLowerCase() === 'female' ? 'female' : 'male'
}

function normalizeActivityLevel(activityLevel) {
  const normalized = String(activityLevel || '').toLowerCase()

  if (normalized === 'lightly_active') return 'light'
  if (normalized === 'moderately_active') return 'moderate'
  if (normalized === 'very_active') return 'active'
  if (normalized === 'sedentary' || normalized === 'light' || normalized === 'moderate' || normalized === 'active') {
    return normalized
  }

  return 'sedentary'
}

function normalizeGoal(goal) {
  const raw = String(goal || '')

  const aliasMap = {
    weight_loss: 'lose',
    rapid_weight_loss: 'loseFast',
    weight_maintenance: 'maintain',
    muscle_gain: 'muscle',
    weight_gain: 'gain',
    endurance_improvement: 'endurance',
    healthy_diet: 'healthy',
  }

  return aliasMap[raw] || (GOALS[raw] ? raw : 'healthy')
}

function calculateBMR({ weight, height, age, gender }) {
  if (!Number.isFinite(weight) || !Number.isFinite(height) || !Number.isFinite(age)) {
    throw new Error('weight, height, and age must be finite numbers')
  }

  if (gender === 'male') {
    return 10 * weight + 6.25 * height - 5 * age + 5
  }

  return 10 * weight + 6.25 * height - 5 * age - 161
}

function applyFoodGroupAdjustments(foodGroups, goal, mealCount) {
  const adjusted = JSON.parse(JSON.stringify(foodGroups))
  const deltas = GOAL_FOOD_GROUP_ADJUSTMENTS[goal] || {}

  const meals = Object.keys(adjusted)
  for (const mealName of meals) {
    const mealDeltas = deltas[mealName]
    if (!mealDeltas) continue

    for (const groupName of Object.keys(mealDeltas)) {
      const base = Number(adjusted[mealName][groupName] || 0)
      adjusted[mealName][groupName] = Math.max(0, base + mealDeltas[groupName])
    }
  }

  void mealCount
  return adjusted
}

function getNutritionDistribution({ goal, mealCount }) {
  const normalizedGoal = normalizeGoal(goal)
  const normalizedMealCount = [3, 4, 5].includes(Number(mealCount)) ? Number(mealCount) : 5

  const mealDistribution = MEAL_DISTRIBUTION[normalizedMealCount]
  const foodGroups = applyFoodGroupAdjustments(FOOD_GROUP_BASE[normalizedMealCount], normalizedGoal, normalizedMealCount)

  return {
    mealDistribution,
    foodGroups,
    mealCount: normalizedMealCount,
    goal: normalizedGoal,
  }
}

function calculateNutritionPlan(profile) {
  const mealCount = [3, 4, 5].includes(Number(profile?.mealCount)) ? Number(profile.mealCount) : 5
  const gender = normalizeGender(profile?.gender)
  const activityKey = normalizeActivityLevel(profile?.activityLevel)
  const goalKey = normalizeGoal(profile?.goal)

  const bmr = calculateBMR({
    weight: Number(profile?.weight),
    height: Number(profile?.height),
    age: Number(profile?.age),
    gender,
  })

  const tdee = bmr * ACTIVITY_LEVELS[activityKey].factor
  const targetCalories = Math.max(MIN_CALORIES[gender], tdee + GOALS[goalKey].adjustment)

  const macros = MACRO_RATIOS[goalKey]
  const dailyMacros = {
    protein: roundTo((targetCalories * macros.protein) / 4, 1),
    carbs: roundTo((targetCalories * macros.carbs) / 4, 1),
    fat: roundTo((targetCalories * macros.fat) / 9, 1),
  }

  const mealPercents = MEAL_DISTRIBUTION[mealCount]
  const baseFoodGroups = FOOD_GROUP_BASE[mealCount]
  const adjustedFoodGroups = applyFoodGroupAdjustments(baseFoodGroups, goalKey, mealCount)

  const meals = Object.entries(mealPercents).map(([mealName, percent]) => {
    const calories = roundTo(targetCalories * percent, 0)
    const foodGroups = adjustedFoodGroups[mealName] || {}

    const foodGroupKcal = Object.fromEntries(
      Object.entries(foodGroups).map(([groupName, groupPercent]) => [
        groupName,
        roundTo(calories * groupPercent, 1),
      ])
    )

    return {
      nombre: mealName,
      calories,
      percent,
      foodGroups: foodGroupKcal,
    }
  })

  return {
    bmr: roundTo(bmr, 1),
    tdee: roundTo(tdee, 1),
    targetCalories: roundTo(targetCalories, 0),
    activityLevel: ACTIVITY_LEVELS[activityKey].label,
    goal: GOALS[goalKey].label,
    mealCount,
    dailyMacros,
    meals,
  }
}

module.exports = {
  ACTIVITY_LEVELS,
  GOALS,
  MACRO_RATIOS,
  MIN_CALORIES,
  MEAL_DISTRIBUTION,
  FOOD_GROUP_BASE,
  GOAL_FOOD_GROUP_ADJUSTMENTS,
  getNutritionDistribution,
  calculateNutritionPlan,
}
