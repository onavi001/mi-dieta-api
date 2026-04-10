function success(res, data, status = 200) {
  return res.status(status).json({ ok: true, data })
}

function failure(res, error, status = 400) {
  return res.status(status).json({ ok: false, error })
}

async function listMeals(req, res) {
  return success(res, {
    meals: [],
    deprecated: true,
    message: 'El catálogo global de comidas está deshabilitado. Usa /api/plans/my/generate con porciones.'
  })
}

async function getMealById(req, res) {
  return failure(
    res,
    'Endpoint deshabilitado: el catálogo global de comidas ya no se usa.',
    410
  )
}

async function createMeal(req, res) {
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
