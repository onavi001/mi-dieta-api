import fs from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'
import vm from 'node:vm'
import dotenv from 'dotenv'
import { createClient } from '@supabase/supabase-js'

dotenv.config()

const requiredEnv = ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY']
for (const key of requiredEnv) {
  if (!process.env[key]) {
    console.error(`[seed:meals] Missing env var: ${key}`)
    process.exit(1)
  }
}

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const argv = process.argv.slice(2)
const dryRun = argv.includes('--dry-run')
const sourceArg = argv.find((arg) => arg.startsWith('--source='))
const sourcePath = sourceArg
  ? sourceArg.replace('--source=', '')
  : '../mi-dieta/src/data/curatedMealCatalog.ts'

const resolvedSource = path.resolve(process.cwd(), sourcePath)

async function loadMealsFromSource(filePath) {
  const raw = await fs.readFile(filePath, 'utf-8')

  if (filePath.endsWith('.json')) {
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed?.meals) ? parsed.meals : []
  }

  if (filePath.endsWith('.ts') || filePath.endsWith('.js')) {
    const transformed = raw
      .replace(/^import type .*$/m, '')
      .replace(/export const CURATED_MEAL_CATALOG_EXPANDED\s*:\s*Comida\[\]\s*=\s*/, 'const CURATED_MEAL_CATALOG_EXPANDED = ')
      .replace(/export function getCuratedExpandedMealsByType[\s\S]*$/, '')
      .concat('\nmodule.exports = { CURATED_MEAL_CATALOG_EXPANDED };\n')

    const sandbox = { module: { exports: {} }, exports: {} }
    vm.runInNewContext(transformed, sandbox, { filename: filePath })
    return Array.isArray(sandbox.module.exports.CURATED_MEAL_CATALOG_EXPANDED)
      ? sandbox.module.exports.CURATED_MEAL_CATALOG_EXPANDED
      : []
  }

  throw new Error(`Unsupported source file: ${filePath}`)
}

function toDbMeal(meal) {
  const ingredientes = Array.isArray(meal.ingredientes)
    ? meal.ingredientes.map((item) => {
      return {
        id: item?.id,
        presentacion: item?.presentacion || '',
        cantidad: typeof item?.cantidad === 'number' ? item.cantidad : 0,
        unidad: item?.unidad || '',
      }
    })
    : []

  return {
    id: meal.id,
    tipo: meal.tipo,
    nombre: meal.nombre,
    receta: meal.receta || '',
    tip: meal.tip || '',
    tags: Array.isArray(meal.tags) ? meal.tags : [],
    forbidden_ingredients: Array.isArray(meal.forbiddenIngredients) ? meal.forbiddenIngredients : [],
    ingredientes,
    group_portions: meal.groupPortions && typeof meal.groupPortions === 'object' ? meal.groupPortions : {},
    real_dish_metadata: meal.realDishMetadata && typeof meal.realDishMetadata === 'object' ? meal.realDishMetadata : {},
  }
}

function isValidMeal(meal) {
  return (
    meal &&
    typeof meal.id === 'string' && meal.id.trim() &&
    typeof meal.tipo === 'string' && meal.tipo.trim() &&
    typeof meal.nombre === 'string' && meal.nombre.trim()
  )
}

async function main() {
  const meals = await loadMealsFromSource(resolvedSource)

  if (meals.length === 0) {
    throw new Error('No meals found in source file')
  }

  const invalid = meals.filter((meal) => !isValidMeal(meal))
  if (invalid.length > 0) {
    throw new Error(`Found ${invalid.length} invalid meal entries`)
  }

  const payload = meals.map(toDbMeal)

  if (dryRun) {
    console.log(`[seed:meals] Dry run OK. Source: ${resolvedSource}`)
    console.log(`[seed:meals] Meals to upsert: ${payload.length}`)
    console.log(`[seed:meals] Sample IDs: ${payload.slice(0, 5).map((m) => m.id).join(', ')}`)
    return
  }

  const { data, error } = await supabase
    .from('meals')
    .upsert(payload, { onConflict: 'id' })
    .select('id, tipo')

  if (error) {
    throw new Error(error.message)
  }

  const countByType = (data || []).reduce((acc, row) => {
    const key = row.tipo || 'Unknown'
    acc[key] = (acc[key] || 0) + 1
    return acc
  }, {})

  console.log(`[seed:meals] Upserted ${data?.length || 0} meals successfully.`)
  console.log('[seed:meals] Distribution by tipo:')
  Object.entries(countByType)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .forEach(([tipo, count]) => {
      console.log(`  - ${tipo}: ${count}`)
    })
}

main().catch((error) => {
  console.error('[seed:meals] Failed:', error.message)
  process.exit(1)
})
