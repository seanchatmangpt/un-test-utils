// Demonstrates snapshot testing: locks in the exact stdout of a CLI command.
// On first run the snapshot is written; subsequent runs compare against it.
// Uses `node --version` — no external dependencies required.
// Run: node examples/snapshot.test.mjs

import { execFileSync } from 'node:child_process'
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { scenario } from '../packages/scenario/index.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const SNAPSHOT_DIR = resolve(__dirname, '__snapshots__')
const SNAPSHOT_FILE = resolve(SNAPSHOT_DIR, 'snapshot.test.mjs.snap.json')

// Minimal snapshot helper: write on first run, compare on subsequent runs.
function matchSnapshot(value, name) {
  if (!existsSync(SNAPSHOT_DIR)) mkdirSync(SNAPSHOT_DIR, { recursive: true })
  const store = existsSync(SNAPSHOT_FILE) ? JSON.parse(readFileSync(SNAPSHOT_FILE, 'utf8')) : {}
  if (!(name in store)) {
    store[name] = value
    writeFileSync(SNAPSHOT_FILE, JSON.stringify(store, null, 2))
    console.log(`  Snapshot "${name}" written.`)
    return
  }
  if (store[name] !== value) {
    throw new Error(`Snapshot mismatch for "${name}":\n  expected: ${store[name]}\n  received: ${value}`)
  }
  console.log(`  Snapshot "${name}" matched.`)
}

function nodeRunner(args) {
  const [bin, ...rest] = args
  const stdout = execFileSync(bin, rest, { encoding: 'utf8' }).trim()
  const result = { success: true, exitCode: 0, stdout, stderr: '', args, durationMs: 0 }
  result.expectSuccess = () => { if (!result.success) throw new Error('Expected success') }
  result.expectSnapshot = (name) => matchSnapshot(result.stdout, name)
  return result
}

const result = await scenario('snapshot node version')
  .step('Get node version', ['node', '--version'])
  .expectSuccess()
  .expect((r) => r.expectSnapshot('node-version'))
  .execute(nodeRunner)

console.log(`Snapshot scenario passed — output: ${result.lastResult.stdout}`)
