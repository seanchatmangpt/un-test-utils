// Demonstrates the simplest possible use of the scenario DSL.
// Uses `node --version` as the CLI — no external dependencies required.
// Run: node examples/basic.test.mjs

import { execFileSync } from 'node:child_process'
import { scenario } from '../packages/scenario/index.js'

// Custom runner that delegates to any system binary instead of a citty CLI file.
function nodeRunner(args) {
  const [bin, ...rest] = args
  const stdout = execFileSync(bin, rest, { encoding: 'utf8' }).trim()
  const result = { success: true, exitCode: 0, stdout, stderr: '', args, durationMs: 0 }
  // Attach the expectation helpers the DSL requires.
  result.expectSuccess = () => { if (!result.success) throw new Error('Expected success') }
  result.expectOutput = (pattern) => {
    const ok = pattern instanceof RegExp ? pattern.test(result.stdout) : result.stdout.includes(pattern)
    if (!ok) throw new Error(`Expected output to match ${pattern}, got: ${result.stdout}`)
  }
  return result
}

const result = await scenario('node --version')
  .step('Print version', ['node', '--version'])
  .expectSuccess()
  .expectOutput(/v\d+\.\d+\.\d+/)
  .execute(nodeRunner)

console.log(`Scenario "${result.scenario}" passed — node is ${result.lastResult.stdout}`)
