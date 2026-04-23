const path = require('path')
const { enrichIngredientReferenceWithPortions } = require('../data/ingredientPortionRules')

const basePayload = require(path.join(__dirname, '../data/ingredientReference.json'))
const payload = enrichIngredientReferenceWithPortions(basePayload)

function getIngredientReference(req, res) {
  req.log?.debug({ event: 'reference.ingredients' }, 'reference')
  res.json({ ok: true, data: payload })
}

module.exports = {
  getIngredientReference,
}
