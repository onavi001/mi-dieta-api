const payload = require('../src/data/ingredientReference.json')
const {
  inferPortionGramEquivalent,
  portionSourceForIngredient,
} = require('../src/data/ingredientPortionRules')

const countsBySource = { override: 0, catalog: 0, inferred: 0 }
const inferred = []
const total = Object.keys(payload.items || {}).length

for (const [ingredientId, item] of Object.entries(payload.items || {})) {
  const source = portionSourceForIngredient(ingredientId, item)
  countsBySource[source] = (countsBySource[source] || 0) + 1
  if (source === 'inferred') {
    inferred.push({
      ingredientId,
      group: item.group || 'unknown',
      grams: inferPortionGramEquivalent(ingredientId, item),
    })
  }
}

console.log('Portion source coverage')
console.log(`- total: ${total}`)
console.log(`- override: ${countsBySource.override}`)
console.log(`- catalog: ${countsBySource.catalog}`)
console.log(`- inferred: ${countsBySource.inferred}`)

if (inferred.length > 0) {
  console.log('\nTop inferred ingredients to review:')
  for (const row of inferred.slice(0, 30)) {
    console.log(`- ${row.ingredientId} (${row.group}): ${row.grams}g`)
  }
}

if (process.argv.includes('--strict') && countsBySource.override !== total) {
  console.error(`\nStrict mode failed: expected ${total} overrides, found ${countsBySource.override}`)
  process.exitCode = 1
}
