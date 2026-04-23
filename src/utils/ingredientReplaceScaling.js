const { enrichIngredientReferenceWithPortions } = require('../data/ingredientPortionRules')
const baseReference = require('../data/ingredientReference.json')

let cachedEnriched = null

function getEnrichedReference() {
  if (!cachedEnriched) {
    cachedEnriched = enrichIngredientReferenceWithPortions(baseReference)
  }
  return cachedEnriched
}

function normalizeIngredientId(value) {
  return String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function toFiniteNumber(value, fallback = 0) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

function normalizeUnitAlias(unitRaw, unitAliases) {
  const key = String(unitRaw || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\./g, '')
  return unitAliases[key] || key
}

function unitToGramsFactor(unitNorm, group, item) {
  if (item?.unitToGrams && typeof item.unitToGrams[unitNorm] === 'number') {
    return item.unitToGrams[unitNorm]
  }

  if (unitNorm === 'g') return 1
  if (unitNorm === 'kg') return 1000
  if (unitNorm === 'ml') return 1
  if (unitNorm === 'l') return 1000
  if (unitNorm === 'oz') return 30
  if (unitNorm === 'tbsp') return 15
  if (unitNorm === 'tsp') return 5
  if (unitNorm === 'slice') return group === 'cereales_tuberculos' ? 30 : 25
  if (unitNorm === 'cup') {
    if (group === 'lacteos_o_sustitutos') return 240
    if (group === 'cereales_tuberculos' || group === 'leguminosas') return 120
    return 150
  }
  if (unitNorm === 'piece') {
    if (group === 'frutas') return 120
    if (group === 'proteina_animal_o_alternativas') return 50
    if (group === 'verduras') return 80
    return 60
  }
  if (unitNorm === 'pinch') return 0.5

  return null
}

function ingredientLineToGrams(ing, items, unitAliases) {
  const id = normalizeIngredientId(ing.id)
  const item = items[id]
  if (!item) return null
  const group = item.group
  const qty = toFiniteNumber(ing.cantidad)
  if (qty <= 0) return null
  const unitNorm = normalizeUnitAlias(ing.unidad, unitAliases)
  const factor = unitToGramsFactor(unitNorm, group, item)
  if (factor == null) return null
  return qty * factor
}

function portionGramsForCatalogId(catalogId, items, groupGramsPerPortion) {
  const item = items[normalizeIngredientId(catalogId)]
  if (!item) return null
  const g = item.portionGramEquivalent
  if (typeof g === 'number' && g > 0) return g
  const fallback = groupGramsPerPortion[item.group]
  return typeof fallback === 'number' && fallback > 0 ? fallback : null
}

/**
 * Al cambiar de ingrediente dentro del mismo grupo, conserva el equivalente en *porciones*
 * del intercambio (listas de intercambio): gramos_nuevo = gramos_actuales / g_porcion_vieja * g_porcion_nueva.
 */
function buildIngredientAfterSameGroupSwap(currentIngredient, nextIngredientIdRaw) {
  const ref = getEnrichedReference()
  const { items, unitAliases, groupGramsPerPortion } = ref

  const nextCatalogId = normalizeIngredientId(nextIngredientIdRaw)
  const currentCatalogId = normalizeIngredientId(currentIngredient.id)

  const itemOld = items[currentCatalogId]
  const itemNew = items[nextCatalogId]
  if (!itemOld || !itemNew || itemOld.group !== itemNew.group) {
    return { ...currentIngredient, id: nextCatalogId }
  }

  const grams = ingredientLineToGrams(currentIngredient, items, unitAliases)
  if (grams == null || !Number.isFinite(grams) || grams <= 0) {
    return { ...currentIngredient, id: nextCatalogId }
  }

  const pOld = portionGramsForCatalogId(currentCatalogId, items, groupGramsPerPortion)
  const pNew = portionGramsForCatalogId(nextCatalogId, items, groupGramsPerPortion)
  if (!pOld || !pNew || pOld <= 0 || pNew <= 0) {
    return { ...currentIngredient, id: nextCatalogId }
  }

  const portions = grams / pOld
  const gramsNew = portions * pNew
  const qty = Math.max(1, Math.round(gramsNew))

  return {
    ...currentIngredient,
    id: nextCatalogId,
    cantidad: qty,
    unidad: 'g',
  }
}

module.exports = {
  buildIngredientAfterSameGroupSwap,
  getEnrichedReference,
}
