const path = require('path')
const { enrichIngredientReferenceWithPortions } = require('../data/ingredientPortionRules')

const basePayload = require(path.join(__dirname, '../data/ingredientReference.json'))
const humanPortionProfiles = require(path.join(__dirname, '../data/ingredientHumanPortionProfiles.json'))

const enriched = enrichIngredientReferenceWithPortions(basePayload)
const profiles = Array.isArray(humanPortionProfiles?.profiles) ? humanPortionProfiles.profiles : []

const payload = {
  ...enriched,
  humanPortionProfiles: profiles,
}

function getIngredientReference(req, res) {
  req.log?.debug({ event: 'reference.ingredients' }, 'reference')
  res.json({ ok: true, data: payload })
}

module.exports = {
  getIngredientReference,
}
