import process from 'node:process'
import dotenv from 'dotenv'
import { createClient } from '@supabase/supabase-js'

dotenv.config()

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error('[verify:meals] Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function main() {
  const { data, error } = await supabase
    .from('meals')
    .select('id, tipo', { count: 'exact' })
    .order('tipo', { ascending: true })

  if (error) {
    throw new Error(error.message)
  }

  const meals = data || []
  const countByType = meals.reduce((acc, row) => {
    const key = row.tipo || 'Unknown'
    acc[key] = (acc[key] || 0) + 1
    return acc
  }, {})

  console.log(`[verify:meals] Total meals in DB: ${meals.length}`)
  Object.entries(countByType)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .forEach(([tipo, count]) => {
      console.log(`  - ${tipo}: ${count}`)
    })

  if (meals.length === 0) {
    process.exitCode = 2
  }
}

main().catch((error) => {
  console.error('[verify:meals] Failed:', error.message)
  process.exit(1)
})
