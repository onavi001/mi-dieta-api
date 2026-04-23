const fs = require('fs')
const path = require('path')
const { enrichIngredientReferenceWithPortions } = require('../src/data/ingredientPortionRules')

const filePath = path.join(__dirname, '../src/data/ingredientReference.json')
const raw = fs.readFileSync(filePath, 'utf8')
const payload = JSON.parse(raw)
const enriched = enrichIngredientReferenceWithPortions(payload)
const output = `${JSON.stringify(enriched)}\n`

fs.writeFileSync(filePath, output, 'utf8')

const ingredientCount = Object.keys(enriched.items || {}).length
console.log(`Updated ${ingredientCount} ingredients with portionGramEquivalent`)
