/**
 * Lista ingredientes cuyo portionGramEquivalent se aleja del promedio del grupo
 * o de un peso implícito por pieza/rebanada en unitToGrams (para revisión clínica).
 *
 * Uso: node scripts/report-portion-curation-review.js
 * Salida: CSV en stdout; código de salida 0.
 */

const payload = require('../src/data/ingredientReference.json')

const groupGrams = payload.groupGramsPerPortion || {}
const items = payload.items || {}

const rows = []

for (const [id, item] of Object.entries(items)) {
  const group = item.group
  const base = typeof groupGrams[group] === 'number' ? groupGrams[group] : null
  const portion = typeof item.portionGramEquivalent === 'number' ? item.portionGramEquivalent : null
  if (!portion || !base) continue

  const ratio = portion / base
  let pieceGrams = null
  if (item.unitToGrams && typeof item.unitToGrams.piece === 'number') {
    pieceGrams = item.unitToGrams.piece
  }
  if (item.unitToGrams && typeof item.unitToGrams.slice === 'number') {
    pieceGrams = pieceGrams == null ? item.unitToGrams.slice : pieceGrams
  }

  let pieceVsPortion = null
  if (pieceGrams && pieceGrams > 0 && portion > 0) {
    pieceVsPortion = Math.max(pieceGrams, portion) / Math.min(pieceGrams, portion)
  }

  const flagGroup = ratio < 0.55 || ratio > 1.85
  const flagPiece = pieceVsPortion != null && pieceVsPortion > 2.2

  if (flagGroup || flagPiece) {
    rows.push({
      id,
      group,
      portionGramEquivalent: portion,
      groupDefault: base,
      ratio: Number(ratio.toFixed(3)),
      pieceOrSliceGrams: pieceGrams,
      flags: [flagGroup ? 'vs_grupo' : null, flagPiece ? 'vs_pieza' : null].filter(Boolean).join('+'),
    })
  }
}

rows.sort((a, b) => Math.abs(b.ratio - 1) - Math.abs(a.ratio - 1))

console.log('id,group,portionGramEquivalent,groupDefault,ratio,pieceOrSliceGrams,flags')
for (const r of rows) {
  console.log(
    [
      r.id,
      r.group,
      r.portionGramEquivalent,
      r.groupDefault,
      r.ratio,
      r.pieceOrSliceGrams ?? '',
      r.flags,
    ].join(',')
  )
}

console.error(`\nCuration hints: ${rows.length} ingredient(s) flagged (review overrides in ingredientPortionOverrides.json)`)
