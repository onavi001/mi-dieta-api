const GROUP_DEFAULT_PORTION_GRAMS = {
  verduras: 75,
  frutas: 120,
  cereales_tuberculos: 25,
  leguminosas: 35,
  proteina_animal_o_alternativas: 30,
  lacteos_o_sustitutos: 240,
  grasas_saludables: 5,
}
const PORTION_OVERRIDES = require('./ingredientPortionOverrides.json')

function normalize(text) {
  return String(text || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
}

function inferProteinPortionGrams(name) {
  const fishKeywords = ['salmon', 'atun', 'tilapia', 'sardina', 'camaron', 'mojarra', 'basa', 'cazon', 'pescado']
  if (fishKeywords.some((k) => name.includes(k))) return 35
  if (name.includes('huevo') || name.includes('tofu') || name.includes('tempeh') || name.includes('soya')) return 50
  const cheeseKeywords = ['queso panela', 'queso cottage', 'queso fresco', 'queso oaxaca', 'queso ricotta']
  if (cheeseKeywords.some((k) => name.includes(k))) return 45
  if (name.includes('jamon')) return 35
  return 30
}

function inferCerealPortionGrams(name) {
  if (name.includes('tortilla de maiz') || name === 'tortilla maiz' || name === 'tortilla') return 25
  if (name.includes('tortilla de harina')) return 40
  if (name.includes('tostada')) return 20
  if (name.includes('pan') || name.includes('pita')) return 30
  if (name.includes('arroz') || name.includes('quinoa') || name.includes('amaranto') || name.includes('pasta') || name.includes('espagueti')) return 50
  if (name.includes('avena')) return 30
  if (name.includes('papa') || name.includes('camote') || name.includes('yuca') || name.includes('platano macho') || name.includes('elote')) return 60
  return 25
}

function inferLegumePortionGrams(name) {
  if (name.includes('hummus')) return 45
  if (name.includes('edamame')) return 50
  return 35
}

function inferFatPortionGrams(name) {
  if (name.includes('aceite')) return 5
  if (name.includes('aguacate') || name.includes('guacamole')) return 30
  if (name.includes('mantequilla de cacahuate') || name.includes('mantequilla de almendra') || name.includes('tahini')) return 15
  if (
    name.includes('nuez') ||
    name.includes('almendra') ||
    name.includes('cacahuate') ||
    name.includes('pistache') ||
    name.includes('ajonjoli') ||
    name.includes('linaza') ||
    name.includes('chia')
  ) return 10
  return 5
}

function inferPortionGramEquivalent(ingredientId, item) {
  const group = item.group
  const normalizedId = normalize(ingredientId)
  const override = PORTION_OVERRIDES[normalizedId]
  if (typeof override === 'number' && override > 0) return override
  if (item.portionGramEquivalent && item.portionGramEquivalent > 0) return item.portionGramEquivalent

  if (group === 'proteina_animal_o_alternativas') return inferProteinPortionGrams(normalizedId)
  if (group === 'cereales_tuberculos') return inferCerealPortionGrams(normalizedId)
  if (group === 'leguminosas') return inferLegumePortionGrams(normalizedId)
  if (group === 'grasas_saludables') return inferFatPortionGrams(normalizedId)
  if (group === 'lacteos_o_sustitutos') {
    if (normalizedId.includes('yogurt') || normalizedId.includes('kefir')) return 240
    if (normalizedId.includes('leche')) return 240
    return 120
  }
  if (group === 'verduras') return 75
  if (group === 'frutas') return 120

  return GROUP_DEFAULT_PORTION_GRAMS[group] || 30
}

function portionSourceForIngredient(ingredientId, item) {
  const normalizedId = normalize(ingredientId)
  if (typeof PORTION_OVERRIDES[normalizedId] === 'number') return 'override'
  if (item.portionGramEquivalent && item.portionGramEquivalent > 0) return 'catalog'
  return 'inferred'
}

function enrichIngredientReferenceWithPortions(payload) {
  const nextItems = {}
  for (const [ingredientId, item] of Object.entries(payload.items || {})) {
    nextItems[ingredientId] = {
      ...item,
      portionGramEquivalent: inferPortionGramEquivalent(ingredientId, item),
    }
  }

  return {
    ...payload,
    items: nextItems,
  }
}

module.exports = {
  GROUP_DEFAULT_PORTION_GRAMS,
  inferPortionGramEquivalent,
  enrichIngredientReferenceWithPortions,
  portionSourceForIngredient,
  PORTION_OVERRIDES,
}
