const { supabaseAdmin } = require('../config/supabase')
const { userIdFromReq } = require('../utils/safeLog')

function success(res, data, status = 200) {
  return res.status(status).json({ ok: true, data })
}

function failure(res, error, status = 400) {
  return res.status(status).json({ ok: false, error })
}

function toMealPayload(row) {
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

async function listMeals(req, res) {
  try {
    const tipo = typeof req.query.tipo === 'string' ? req.query.tipo.trim() : ''
    req.log?.debug({ ...userIdFromReq(req), event: 'meal.list', hasTipoFilter: Boolean(tipo) }, 'meal')

    let query = supabaseAdmin
      .from('meals')
      .select('id, tipo, nombre, receta, tip, tags, forbidden_ingredients, ingredientes, group_portions, real_dish_metadata')
      .order('tipo', { ascending: true })
      .order('nombre', { ascending: true })

    if (tipo) {
      query = query.eq('tipo', tipo)
    }

    const { data, error } = await query
    if (error) {
      return failure(res, error.message, 400)
    }

    return success(res, { meals: (data || []).map(toMealPayload) })
  } catch (error) {
    req.log?.error({ err: error, ...userIdFromReq(req), event: 'meal.list_error' }, 'meal')
    return failure(res, 'Failed to list meals', 500)
  }
}

async function getMealById(req, res) {
  try {
    req.log?.debug({ ...userIdFromReq(req), event: 'meal.get', mealId: req.params.id }, 'meal')
    const { data, error } = await supabaseAdmin
      .from('meals')
      .select('id, tipo, nombre, receta, tip, tags, forbidden_ingredients, ingredientes, group_portions, real_dish_metadata')
      .eq('id', req.params.id)
      .maybeSingle()

    if (error) {
      return failure(res, error.message, 400)
    }

    if (!data) {
      return failure(res, 'Meal not found', 404)
    }

    return success(res, { meal: toMealPayload(data) })
  } catch (error) {
    req.log?.error({ err: error, ...userIdFromReq(req), event: 'meal.get_error' }, 'meal')
    return failure(res, 'Failed to fetch meal', 500)
  }
}

async function createMeal(req, res) {
  req.log?.warn({ ...userIdFromReq(req), event: 'meal.create_disabled' }, 'meal')
  return failure(
    res,
    'Operación deshabilitada: el catálogo global de comidas ya no se usa.',
    410
  )
}

async function updateMeal(req, res) {
  return failure(
    res,
    'Operación deshabilitada: el catálogo global de comidas ya no se usa.',
    410
  )
}

async function deleteMeal(req, res) {
  req.log?.warn({ ...userIdFromReq(req), event: 'meal.delete_disabled', mealId: req.params.id }, 'meal')
  return failure(
    res,
    'Operación deshabilitada: el catálogo global de comidas ya no se usa.',
    410
  )
}

module.exports = {
  listMeals,
  getMealById,
  createMeal,
  updateMeal,
  deleteMeal,
}
