#!/usr/bin/env node
const { execFileSync } = require('child_process')
const fs = require('fs')
const path = require('path')

function walkJs(dir, acc = []) {
  for (const name of fs.readdirSync(dir)) {
    const p = path.join(dir, name)
    const st = fs.statSync(p)
    if (st.isDirectory()) walkJs(p, acc)
    else if (name.endsWith('.js')) acc.push(p)
  }
  return acc
}

const root = path.join(__dirname, '..', 'src')
const files = walkJs(root)
for (const f of files) {
  execFileSync(process.execPath, ['--check', f], { stdio: 'inherit' })
}
