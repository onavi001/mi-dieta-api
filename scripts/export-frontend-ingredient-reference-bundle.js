/**
 * Escribe el payload completo de referencia (como lo sirve GET /api/reference/ingredients)
 * en el repo del frontend, para modo offline / fallback.
 *
 * Uso (desde mi-dieta-api, con ambos repos como hermanos en disco):
 *   node scripts/export-frontend-ingredient-reference-bundle.js
 *
 * Override de ruta destino:
 *   FRONTEND_INGREDIENT_BUNDLE=/ruta/a/ingredientReference.bundle.json node scripts/...
 */

const fs = require('fs')
const path = require('path')
const { enrichIngredientReferenceWithPortions } = require('../src/data/ingredientPortionRules')

const basePayload = require('../src/data/ingredientReference.json')
const humanPortionProfiles = require('../src/data/ingredientHumanPortionProfiles.json')

const enriched = enrichIngredientReferenceWithPortions(basePayload)
const profiles = Array.isArray(humanPortionProfiles?.profiles) ? humanPortionProfiles.profiles : []

const payload = {
  ...enriched,
  humanPortionProfiles: profiles,
}

const defaultOut = path.join(__dirname, '../../mi-dieta/src/data/reference/ingredientReference.bundle.json')
const outPath = process.env.FRONTEND_INGREDIENT_BUNDLE || defaultOut

fs.mkdirSync(path.dirname(outPath), { recursive: true })
fs.writeFileSync(outPath, `${JSON.stringify(payload)}\n`, 'utf8')
console.log(`Wrote frontend bundle: ${outPath}`)
