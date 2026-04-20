const path = require('path')

const payload = require(path.join(__dirname, '../data/ingredientReference.json'))

function getIngredientReference(req, res) {
  req.log?.debug({ event: 'reference.ingredients' }, 'reference')
  res.json({ ok: true, data: payload })
}

module.exports = {
  getIngredientReference,
}
