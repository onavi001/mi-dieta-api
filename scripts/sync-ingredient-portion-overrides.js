const fs = require('fs')
const path = require('path')

const referencePath = path.join(__dirname, '../src/data/ingredientReference.json')
const overridesPath = path.join(__dirname, '../src/data/ingredientPortionOverrides.json')

const referencePayload = JSON.parse(fs.readFileSync(referencePath, 'utf8'))
const items = referencePayload.items || {}
const overrides = {}

for (const ingredientId of Object.keys(items).sort((a, b) => a.localeCompare(b))) {
  const grams = Number(items[ingredientId]?.portionGramEquivalent)
  if (Number.isFinite(grams) && grams > 0) {
    overrides[ingredientId] = grams
  }
}

fs.writeFileSync(overridesPath, `${JSON.stringify(overrides, null, 2)}\n`, 'utf8')
console.log(`Synced ${Object.keys(overrides).length} explicit portion overrides`)
