// Demonstrates concurrent scenario execution: 3 steps run in parallel via Promise.all.
// Uses built-in `node` and `echo` equivalents — no external dependencies required.
// Run: node examples/concurrent.test.mjs

import { execFileSync } from 'node:child_process'
import { concurrentScenario } from '../packages/scenario/index.js'

function nodeRunner(args) {
  const [bin, ...rest] = args
  const stdout = execFileSync(bin, rest, { encoding: 'utf8' }).trim()
  const result = { success: true, exitCode: 0, stdout, stderr: '', args, durationMs: 0 }
  result.expectSuccess = () => { if (!result.success) throw new Error('Expected success') }
  result.expectOutput = (pattern) => {
    const ok = pattern instanceof RegExp ? pattern.test(result.stdout) : result.stdout.includes(pattern)
    if (!ok) throw new Error(`Expected output to match ${pattern}, got: ${result.stdout}`)
  }
  return result
}

// concurrentScenario() is shorthand for scenario(name).concurrent()
// All three steps run via Promise.all — order of completion is not guaranteed.
const result = await concurrentScenario('parallel node checks')
  .step('Version check', ['node', '--version'])
  .expectSuccess()
  .expectOutput(/v\d+/)
  .step('Eval pi', ['node', '-e', 'console.log(Math.PI.toFixed(4))'])
  .expectSuccess()
  .expectOutput('3.1416')
  .step('Eval true', ['node', '-e', 'console.log(true)'])
  .expectSuccess()
  .expectOutput('true')
  .execute(nodeRunner)

const names = result.results.map((r) => r.step).join(', ')
console.log(`All concurrent steps passed: ${names}`)
