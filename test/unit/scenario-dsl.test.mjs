import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  scenario,
  concurrentScenario,
  localScenario,
  cleanroomScenario,
} from '@un-test/scenario'

// Shared fake runner that returns a controllable result object
function makeFakeResult(overrides = {}) {
  return {
    exitCode: 0,
    stdout: 'fake output',
    stderr: '',
    expectSuccess: vi.fn(),
    expectFailure: vi.fn(),
    expectOutput: vi.fn(),
    expectNoStderr: vi.fn(),
    expectNoOutput: vi.fn(),
    expectStderr: vi.fn(),
    expectExit: vi.fn(),
    expectJson: vi.fn(),
    ...overrides,
  }
}

function makeRunner(result) {
  return vi.fn().mockResolvedValue(result ?? makeFakeResult())
}

// ── 1. Builder shape ──────────────────────────────────────────────────────────

describe('scenario() builder shape', () => {
  it('returns an object with all chainable methods', () => {
    const b = scenario('shape-check')
    const methods = [
      'step', 'run', 'action', 'expect', 'concurrent', 'sequential', 'mode',
      'execute',
      'expectSuccess', 'expectFailure', 'expectExit', 'expectOutput',
      'expectStderr', 'expectNoOutput', 'expectNoStderr', 'expectJson',
      'expectSnapshot', 'expectSnapshotStdout', 'expectSnapshotStderr',
      'expectSnapshotJson', 'expectSnapshotFull', 'expectSnapshotOutput',
      'snapshot',
    ]
    for (const m of methods) {
      expect(typeof b[m], `method ${m}`).toBe('function')
    }
  })

  it('exposes ._steps as an empty array initially', () => {
    const b = scenario('empty')
    expect(b._steps).toEqual([])
  })
})

// ── 2. .step() accumulates steps ─────────────────────────────────────────────

describe('.step() accumulation', () => {
  it('adds a single step with string args', () => {
    const b = scenario('s').step('Help', '--help')
    expect(b._steps).toHaveLength(1)
    expect(b._steps[0].description).toBe('Help')
    expect(b._steps[0].args).toEqual(['--help'])
  })

  it('splits string args on whitespace', () => {
    const b = scenario('s').step('Build', 'build --prod')
    expect(b._steps[0].args).toEqual(['build', '--prod'])
  })

  it('accepts array args directly', () => {
    const b = scenario('s').step('Init', ['init', 'proj'])
    expect(b._steps[0].args).toEqual(['init', 'proj'])
  })

  it('accumulates multiple steps in order', () => {
    const b = scenario('s')
      .step('A', 'a')
      .step('B', 'b')
      .step('C', 'c')
    expect(b._steps).toHaveLength(3)
    expect(b._steps.map((s) => s.description)).toEqual(['A', 'B', 'C'])
  })

  it('records options on the step', () => {
    const opts = { cwd: '/tmp', timeout: 5000 }
    const b = scenario('s').step('X', 'x', opts)
    expect(b._steps[0].options).toEqual(opts)
  })

  it('initialises expectations as empty array', () => {
    const b = scenario('s').step('X', 'x')
    expect(b._steps[0].expectations).toEqual([])
  })
})

// ── 3. Chainable convenience expectation methods ──────────────────────────────

describe('chainable expectation methods', () => {
  let b

  beforeEach(() => {
    b = scenario('chain').step('S', 'cmd')
  })

  it('.expectSuccess() returns the builder', () => {
    expect(b.expectSuccess()).toBe(b)
  })

  it('.expectFailure() returns the builder', () => {
    expect(b.expectFailure()).toBe(b)
  })

  it('.expectOutput() returns the builder', () => {
    expect(b.expectOutput(/x/)).toBe(b)
  })

  it('.expectNoStderr() returns the builder', () => {
    expect(b.expectNoStderr()).toBe(b)
  })

  it('.expectNoOutput() returns the builder', () => {
    expect(b.expectNoOutput()).toBe(b)
  })

  it('.expectStderr() returns the builder', () => {
    expect(b.expectStderr(/err/)).toBe(b)
  })

  it('.expectExit() returns the builder', () => {
    expect(b.expectExit(0)).toBe(b)
  })

  it('.expectJson() returns the builder', () => {
    expect(b.expectJson(() => {})).toBe(b)
  })

  it('.expect() returns the builder', () => {
    expect(b.expect(() => {})).toBe(b)
  })

  it('each expectation adds a function to currentStep.expectations', () => {
    b.expectSuccess().expectOutput('hi').expectNoStderr()
    expect(b._steps[0].expectations).toHaveLength(3)
    b._steps[0].expectations.forEach((fn) => expect(typeof fn).toBe('function'))
  })

  it('expectations are called with the result during execute()', async () => {
    const result = makeFakeResult()
    const runner = makeRunner(result)

    await scenario('exec')
      .step('S', 'cmd')
      .expectSuccess()
      .expectNoStderr()
      .execute(runner)

    expect(result.expectSuccess).toHaveBeenCalledTimes(1)
    expect(result.expectNoStderr).toHaveBeenCalledTimes(1)
  })
})

// ── 4. Factory helpers ────────────────────────────────────────────────────────

describe('concurrentScenario()', () => {
  it('returns a builder with all chainable methods', () => {
    const b = concurrentScenario('c')
    expect(typeof b.step).toBe('function')
    expect(typeof b.execute).toBe('function')
  })

  it('executes in concurrent mode', async () => {
    const runner = makeRunner()
    const result = await concurrentScenario('c')
      .step('A', 'a')
      .expectSuccess()
      .execute(runner)
    expect(result.concurrent).toBe(true)
  })
})

describe('localScenario()', () => {
  it('returns a valid builder', () => {
    const b = localScenario('l')
    expect(typeof b.step).toBe('function')
    expect(typeof b.execute).toBe('function')
  })

  it('uses local mode', async () => {
    const runner = makeRunner()
    const result = await localScenario('l')
      .step('A', 'a')
      .expectSuccess()
      .execute(runner)
    expect(result.mode).toBe('local')
  })
})

describe('cleanroomScenario()', () => {
  it('returns a valid builder', () => {
    const b = cleanroomScenario('cr')
    expect(typeof b.step).toBe('function')
    expect(typeof b.execute).toBe('function')
  })

  it('uses cleanroom mode', async () => {
    const runner = makeRunner()
    const result = await cleanroomScenario('cr')
      .step('A', 'a')
      .expectSuccess()
      .execute(runner)
    expect(result.mode).toBe('cleanroom')
  })
})

// ── 5. Edge cases ─────────────────────────────────────────────────────────────

describe('edge cases', () => {
  it('empty string scenario name is accepted (builder created)', () => {
    expect(() => scenario('')).not.toThrow()
    const b = scenario('')
    expect(typeof b.step).toBe('function')
  })

  it('execute() with no steps throws "No steps defined"', async () => {
    await expect(scenario('empty').execute(makeRunner())).rejects.toThrow('No steps defined')
  })

  it('step with no args throws "has no command" on execute()', async () => {
    const b = scenario('x').step('no-args')
    await expect(b.execute(makeRunner())).rejects.toThrow('has no command')
  })

  it('step with empty-string args produces [] and throws "has no command"', async () => {
    const b = scenario('x').step('empty-str', '')
    expect(b._steps[0].args).toEqual([])
    await expect(b.execute(makeRunner())).rejects.toThrow('has no command')
  })

  it('step with no expectations throws "has no expectations" on execute()', async () => {
    const b = scenario('x').step('no-exp', 'cmd')
    await expect(b.execute(makeRunner())).rejects.toThrow('has no expectations')
  })

  it('concurrent mode with 0 steps throws "No steps defined"', async () => {
    await expect(concurrentScenario('empty').execute(makeRunner())).rejects.toThrow(
      'No steps defined'
    )
  })

  it('concurrent mode single step with no command throws', async () => {
    await expect(
      concurrentScenario('c').step('bad').execute(makeRunner())
    ).rejects.toThrow('has no command')
  })

  it('.expect() without a prior step throws', () => {
    expect(() => scenario('x').expect(() => {})).toThrow('Must call step() before expect()')
  })

  it('.run() without a prior step throws', () => {
    expect(() => scenario('x').run(['--help'])).toThrow('Must call step() before run()')
  })
})

// ── 6. Builder isolation (no shared state) ────────────────────────────────────

describe('builder isolation', () => {
  it('two scenario() calls do not share steps', () => {
    const a = scenario('A').step('a1', 'x')
    const b = scenario('B')
    expect(a._steps).toHaveLength(1)
    expect(b._steps).toHaveLength(0)
  })

  it('adding steps to one builder does not affect another', () => {
    const a = scenario('A')
    const b = scenario('B')

    a.step('step-a', 'cmd-a')
    b.step('step-b1', 'cmd-b1').step('step-b2', 'cmd-b2')

    expect(a._steps).toHaveLength(1)
    expect(b._steps).toHaveLength(2)
  })

  it('expectations on one builder do not leak to another', () => {
    const a = scenario('A').step('s', 'cmd').expectSuccess()
    const b = scenario('B').step('s', 'cmd')

    expect(a._steps[0].expectations).toHaveLength(1)
    expect(b._steps[0].expectations).toHaveLength(0)
  })

  it('concurrent flag is per-builder', () => {
    const a = scenario('A').concurrent()
    const b = scenario('B')

    // Execute both with a runner to verify concurrent flag
    const runner = makeRunner()
    return Promise.all([
      a.step('s', 'x').expectSuccess().execute(runner).then((r) => {
        expect(r.concurrent).toBe(true)
      }),
      b.step('s', 'x').expectSuccess().execute(runner).then((r) => {
        expect(r.concurrent).toBe(false)
      }),
    ])
  })

  it('mode is per-builder', async () => {
    const runner = makeRunner()
    const local = await localScenario('L').step('s', 'x').expectSuccess().execute(runner)
    const clean = await cleanroomScenario('C').step('s', 'x').expectSuccess().execute(runner)

    expect(local.mode).toBe('local')
    expect(clean.mode).toBe('cleanroom')
  })
})

// ── 7. execute() result shape ─────────────────────────────────────────────────

describe('execute() result shape', () => {
  it('returns scenario name, results array, success flag, lastResult, concurrent, mode', async () => {
    const runner = makeRunner()
    const result = await scenario('my-scenario')
      .step('S', 'cmd')
      .expectSuccess()
      .execute(runner)

    expect(result.scenario).toBe('my-scenario')
    expect(Array.isArray(result.results)).toBe(true)
    expect(result.results).toHaveLength(1)
    expect(typeof result.success).toBe('boolean')
    expect(result.lastResult).toBeDefined()
    expect(typeof result.concurrent).toBe('boolean')
    expect(typeof result.mode).toBe('string')
  })

  it('multi-step result has all steps in order', async () => {
    const runner = makeRunner()
    const result = await scenario('multi')
      .step('A', 'a').expectSuccess()
      .step('B', 'b').expectSuccess()
      .step('C', 'c').expectSuccess()
      .execute(runner)

    expect(result.results.map((r) => r.step)).toEqual(['A', 'B', 'C'])
  })

  it('concurrent results are returned in original step order', async () => {
    const runner = makeRunner()
    const result = await concurrentScenario('ord')
      .step('X', 'x').expectSuccess()
      .step('Y', 'y').expectSuccess()
      .step('Z', 'z').expectSuccess()
      .execute(runner)

    expect(result.results.map((r) => r.step)).toEqual(['X', 'Y', 'Z'])
  })
})
