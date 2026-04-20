/**
 * Reparto de porciones por comida y grupo — alineado con
 * mi-dieta/src/services/nutrition/professionalNutritionRules.ts
 * (misma matriz FOOD_GROUP_BASE, mismos ajustes por objetivo y mismos pesos por comidas/día).
 */

const DEFAULT_MEAL_DISTRIBUTION = {
  breakfast: 25,
  snackAm: 10,
  lunch: 30,
  snackPm: 10,
  dinner: 25,
}

const MEAL_DISTRIBUTION_BY_COUNT = {
  3: {
    breakfast: 30,
    snackAm: 0,
    lunch: 40,
    snackPm: 0,
    dinner: 30,
  },
  4: {
    breakfast: 25,
    snackAm: 0,
    lunch: 35,
    snackPm: 10,
    dinner: 30,
  },
  5: {
    breakfast: 25,
    snackAm: 10,
    lunch: 30,
    snackPm: 10,
    dinner: 25,
  },
}

const Z = () => ({
  verduras: 0,
  frutas: 0,
  cereales_tuberculos: 0,
  leguminosas: 0,
  proteina_animal_o_alternativas: 0,
  lacteos_o_sustitutos: 0,
  grasas_saludables: 0,
})

const FOOD_GROUP_BASE = {
  3: {
    breakfast: {
      verduras: 0,
      frutas: 0.2,
      cereales_tuberculos: 0.45,
      leguminosas: 0,
      proteina_animal_o_alternativas: 0.2,
      lacteos_o_sustitutos: 0.15,
      grasas_saludables: 0,
    },
    snackAm: Z(),
    lunch: {
      verduras: 0.35,
      frutas: 0,
      cereales_tuberculos: 0.25,
      leguminosas: 0.2,
      proteina_animal_o_alternativas: 0.2,
      lacteos_o_sustitutos: 0,
      grasas_saludables: 0,
    },
    snackPm: Z(),
    dinner: {
      verduras: 0.4,
      frutas: 0,
      cereales_tuberculos: 0.15,
      leguminosas: 0.15,
      proteina_animal_o_alternativas: 0.3,
      lacteos_o_sustitutos: 0,
      grasas_saludables: 0,
    },
  },
  4: {
    breakfast: {
      verduras: 0,
      frutas: 0.2,
      cereales_tuberculos: 0.4,
      leguminosas: 0,
      proteina_animal_o_alternativas: 0.25,
      lacteos_o_sustitutos: 0.15,
      grasas_saludables: 0,
    },
    snackAm: Z(),
    lunch: {
      verduras: 0.35,
      frutas: 0,
      cereales_tuberculos: 0.25,
      leguminosas: 0.2,
      proteina_animal_o_alternativas: 0.2,
      lacteos_o_sustitutos: 0,
      grasas_saludables: 0,
    },
    snackPm: {
      verduras: 0,
      frutas: 0.6,
      cereales_tuberculos: 0,
      leguminosas: 0,
      proteina_animal_o_alternativas: 0,
      lacteos_o_sustitutos: 0.4,
      grasas_saludables: 0,
    },
    dinner: {
      verduras: 0.4,
      frutas: 0,
      cereales_tuberculos: 0.15,
      leguminosas: 0.15,
      proteina_animal_o_alternativas: 0.3,
      lacteos_o_sustitutos: 0,
      grasas_saludables: 0,
    },
  },
  5: {
    breakfast: {
      verduras: 0,
      frutas: 0.25,
      cereales_tuberculos: 0.4,
      leguminosas: 0,
      proteina_animal_o_alternativas: 0.2,
      lacteos_o_sustitutos: 0.15,
      grasas_saludables: 0,
    },
    snackAm: {
      verduras: 0,
      frutas: 0.6,
      cereales_tuberculos: 0,
      leguminosas: 0,
      proteina_animal_o_alternativas: 0,
      lacteos_o_sustitutos: 0.4,
      grasas_saludables: 0,
    },
    lunch: {
      verduras: 0.35,
      frutas: 0,
      cereales_tuberculos: 0.25,
      leguminosas: 0.2,
      proteina_animal_o_alternativas: 0.2,
      lacteos_o_sustitutos: 0,
      grasas_saludables: 0,
    },
    snackPm: {
      verduras: 0,
      frutas: 0.6,
      cereales_tuberculos: 0,
      leguminosas: 0,
      proteina_animal_o_alternativas: 0,
      lacteos_o_sustitutos: 0.4,
      grasas_saludables: 0,
    },
    dinner: {
      verduras: 0.4,
      frutas: 0,
      cereales_tuberculos: 0.15,
      leguminosas: 0.15,
      proteina_animal_o_alternativas: 0.3,
      lacteos_o_sustitutos: 0,
      grasas_saludables: 0,
    },
  },
}

const GOAL_FOOD_GROUP_ADJUSTMENTS = {
  lose: {
    lunch: { verduras: 0.05, cereales_tuberculos: -0.05 },
    dinner: { verduras: 0.05, cereales_tuberculos: -0.05 },
  },
  loseFast: {
    lunch: { verduras: 0.05, cereales_tuberculos: -0.05 },
    dinner: { verduras: 0.05, cereales_tuberculos: -0.05 },
  },
  maintain: {},
  muscle: {
    breakfast: { proteina_animal_o_alternativas: 0.05, lacteos_o_sustitutos: -0.05 },
    lunch: { proteina_animal_o_alternativas: 0.05, leguminosas: -0.05 },
    dinner: { proteina_animal_o_alternativas: 0.05, verduras: -0.05 },
  },
  gain: {
    breakfast: { cereales_tuberculos: 0.05, frutas: -0.05 },
    lunch: { cereales_tuberculos: 0.05, verduras: -0.05 },
  },
  endurance: {
    breakfast: { cereales_tuberculos: 0.1, proteina_animal_o_alternativas: -0.05, lacteos_o_sustitutos: -0.05 },
    lunch: { cereales_tuberculos: 0.1, proteina_animal_o_alternativas: -0.05, leguminosas: -0.05 },
  },
  healthy: {},
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

const PLAN_GROUP_KEYS = Object.keys(GROUP_GRAMS_PER_PORTION)

function toFiniteNumber(value, fallback = 0) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

function mealDistributionKeys(mealCount) {
  if (mealCount <= 3) return ['breakfast', 'lunch', 'dinner']
  if (mealCount === 4) return ['breakfast', 'lunch', 'snackPm', 'dinner']
  return ['breakfast', 'snackAm', 'lunch', 'snackPm', 'dinner']
}

function mealDistributionWeightsMap(mealCount, customDistribution) {
  const keys = mealDistributionKeys(mealCount)
  const mc = mealCount <= 3 ? 3 : mealCount === 4 ? 4 : 5
  const defaultsByCount = MEAL_DISTRIBUTION_BY_COUNT[mc]

  const rawByKey = {
    breakfast: 0,
    snackAm: 0,
    lunch: 0,
    snackPm: 0,
    dinner: 0,
  }

  for (const key of keys) {
    const customValue = customDistribution?.[key]
    rawByKey[key] =
      typeof customValue === 'number' && Number.isFinite(customValue) && customValue >= 0
        ? customValue
        : defaultsByCount[key]
  }

  const total = keys.reduce((acc, key) => acc + rawByKey[key], 0)
  if (total <= 0) {
    const fallbackTotal = keys.reduce((acc, key) => acc + defaultsByCount[key], 0)
    for (const key of keys) {
      rawByKey[key] = defaultsByCount[key] / fallbackTotal
    }
    return rawByKey
  }

  for (const key of keys) {
    rawByKey[key] = rawByKey[key] / total
  }

  return rawByKey
}

function goalFoodGroupMatrix(mealCount, goal) {
  const normalizedMealCount = mealCount <= 3 ? 3 : mealCount === 4 ? 4 : 5
  const base = JSON.parse(JSON.stringify(FOOD_GROUP_BASE[normalizedMealCount]))
  const deltas = GOAL_FOOD_GROUP_ADJUSTMENTS[goal] || {}

  for (const mealKey of Object.keys(deltas)) {
    const byGroup = deltas[mealKey] || {}
    for (const group of Object.keys(byGroup)) {
      const current = Number(base[mealKey]?.[group] || 0)
      const delta = Number(byGroup[group] || 0)
      base[mealKey][group] = Math.max(0, current + delta)
    }
  }

  return base
}

function distributeGroupPortionsByMeal(group, totalPortions, keys, baseWeightsByKey, options = {}) {
  const empty = {
    breakfast: 0,
    snackAm: 0,
    lunch: 0,
    snackPm: 0,
    dinner: 0,
  }

  if (!Number.isFinite(totalPortions) || totalPortions <= 0) return empty

  const goal = options.goal || 'healthy'
  const matrix = goalFoodGroupMatrix(keys.length, goal)
  const weightedRaw = keys.map((key) => baseWeightsByKey[key] * matrix[key][group])
  const weightedTotal = weightedRaw.reduce((acc, value) => acc + value, 0)
  if (weightedTotal <= 0) return empty

  keys.forEach((key, idx) => {
    empty[key] = totalPortions * (weightedRaw[idx] / weightedTotal)
  })

  return empty
}

/**
 * @param {Record<string, number>} portionsByGroup - claves como en el plan (verduras, cereales_tuberculos, …)
 * @param {Record<string, number>} rawDistributionByMeal - porcentajes o pesos por breakfast, snackAm, … (como en el perfil)
 * @param {{ goal?: string, mealCount?: number }} options
 * @returns {Record<string, Record<string, number>>} gramos por distribution key y por grupo
 */
function buildMealGroupGrams(portionsByGroup, rawDistributionByMeal = {}, options = {}) {
  const goal = options.goal || 'healthy'
  const mealCount = [3, 4, 5].includes(Number(options.mealCount)) ? Number(options.mealCount) : 5
  const keys = mealDistributionKeys(mealCount)
  const weights = mealDistributionWeightsMap(mealCount, {
    breakfast: toFiniteNumber(rawDistributionByMeal?.breakfast, DEFAULT_MEAL_DISTRIBUTION.breakfast),
    snackAm: toFiniteNumber(rawDistributionByMeal?.snackAm, DEFAULT_MEAL_DISTRIBUTION.snackAm),
    lunch: toFiniteNumber(rawDistributionByMeal?.lunch, DEFAULT_MEAL_DISTRIBUTION.lunch),
    snackPm: toFiniteNumber(rawDistributionByMeal?.snackPm, DEFAULT_MEAL_DISTRIBUTION.snackPm),
    dinner: toFiniteNumber(rawDistributionByMeal?.dinner, DEFAULT_MEAL_DISTRIBUTION.dinner),
  })

  const allKeys = ['breakfast', 'snackAm', 'lunch', 'snackPm', 'dinner']
  const result = {
    breakfast: {},
    snackAm: {},
    lunch: {},
    snackPm: {},
    dinner: {},
  }

  for (const group of PLAN_GROUP_KEYS) {
    const dailyPortions = toFiniteNumber(portionsByGroup?.[group], 0)
    const distributed = distributeGroupPortionsByMeal(group, dailyPortions, keys, weights, { goal })
    for (const key of allKeys) {
      const portions = distributed[key] || 0
      result[key][group] = portions * GROUP_GRAMS_PER_PORTION[group]
    }
  }

  return result
}

module.exports = {
  buildMealGroupGrams,
  DEFAULT_MEAL_DISTRIBUTION,
}
