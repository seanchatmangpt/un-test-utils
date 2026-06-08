# explorer_investigate Handoff Report

## 1. Observation
We ran the Vitest test suite via `npm test` and observed 12 failing test files with a total of 98 failing assertions out of 321.

### Failure A: Zod Validation Error on Positional Arguments
In `test/unit/snapshot.test.mjs`, tests targeting `runLocalCitty` pass positional arguments:
- `test/unit/snapshot.test.mjs:304`:
  ```javascript
  const result = await runLocalCitty(['--help'], {
    env: { TEST_CLI: 'true' },
  })
  ```
- Resulting error:
  ```
   FAIL  test/unit/snapshot.test.mjs > Snapshot Testing > Integration with Local Runner > should work with runLocalCitty and snapshot assertions
  ZodError: [
    {
      "expected": "object",
      "code": "invalid_type",
      "path": [],
      "message": "Invalid input: expected object, received array"
    }
  ]
   ❯ Module.runLocalCitty src/core/runners/local-runner.js:58:46
  ```

### Failure B: Scenario DSL `.run` is not a function
Multiple tests chain `.run` after `.step`, which fails because the builder object has no `.run` method:
- `test/unit/scenario-dsl.test.mjs:42`:
  ```javascript
  .step('First step')
  .run(['--help'])
  ```
- Resulting error:
  ```
  TypeError: scenario(...).step(...).run is not a function
  ```

### Failure C: Missing Command Validation throwing Incorrect Error
When a step has no command (e.g. no args or action), the test expects a specific error message, but get a different one:
- `test/unit/scenario-dsl.test.mjs:79`:
  ```javascript
  it('should throw error for step without command', async () => {
    const mockRunner = vi.fn()
    const testScenario = scenario('Test Scenario').step('Step without command')
    await expect(testScenario.execute(mockRunner)).rejects.toThrow(
      'Step "Step without command" has no command'
    )
  })
  ```
- Resulting error:
  ```
  AssertionError: expected [Function] to throw error including 'Step "Step without command" has no co…' but got 'Step "Step without command" has no ex…'
  - Expected
  + Received
  - Step "Step without command" has no command
  + Step "Step without command" has no expectations
  ```

### Failure D: Unified Expectations Wrapper Missing
In `test/unit/snapshot.test.mjs` (Pre-built Snapshot Scenarios), `r.expectSuccess()` is called but fails:
- `src/core/scenarios/scenarios.js:220`:
  ```javascript
  r.expectSuccess().expectSnapshotStdout('help-output')
  ```
- Resulting error:
  ```
  TypeError: r.expectSuccess is not a function
  ```

---

## 2. Logic Chain
1. **Runner Signatures (R1)**:
   - `runLocalCitty` in `src/core/runners/local-runner.js` only expects one argument (`options`), which is parsed by `LocalRunnerOptionsSchema.parse(options)`.
   - If an array is passed as the first parameter (positional `args`), `options` is parsed as an array, triggering a `ZodError` ("expected object, received array").
   - By normalizing the arguments `(argsOrOptions, options = {})` before passing them to the Zod schema, we can map `Array.isArray(argsOrOptions)` to `{ ...options, args: argsOrOptions }`, making the signatures backward-compatible.
   - Returning the result wrapped via `wrapExpectation` from `../assertions/assertions.js` ensures that all unified assertion methods (like `expectSuccess`, `expectSnapshotStdout`, etc.) are attached to the returned result, resolving `r.expectSuccess is not a function`.

2. **Scenario DSL `.run()` Chaining (R2)**:
   - `src/core/scenarios/scenario-dsl.js` defines a `scenario` builder but lacks a `.run(args, options)` method.
   - Implementing `.run(args, options)` on the builder that modifies `currentStep.args` and `currentStep.options`, and then returns `this` (the builder), restores the chaining behavior.

3. **Step Command Validation (R3)**:
   - In `scenario-dsl.js`, `.step(name)` initializes `args` to `[]` when `args` is not provided.
   - During `execute()`, the validation check `if (!step.args && !step.action)` evaluates to false because `step.args` is an array `[]` (truthy). Thus, it skips the check and fails on `expectations.length === 0`, throwing `has no expectations` instead.
   - Adjusting this check to `if (!step.action && (!step.args || step.args.length === 0))` correctly detects when a command step is missing its command, throwing the expected `Step <name> has no command` error.

---

## 3. Caveats
- We assume that `wrapExpectation` handles all properties of the execution result. We added both `duration` and `durationMs` to the result object to support both assertion methods correctly.
- We assume local CLI execution is the primary failure target; cleanroom execution already wraps its results in the expectation layer.

---

## 4. Conclusion
To resolve the failing tests, the following changes are proposed:
1. Update `src/core/runners/local-runner.js` to normalize the input parameters `(argsOrOptions, options = {})` in `runLocalCitty` and `runLocalCittySafe`, and wrap their output in `wrapExpectation` (imported from `../assertions/assertions.js`).
2. Add a `.run(args, options)` method to the Scenario DSL builder in `src/core/scenarios/scenario-dsl.js`.
3. Update the step command validation in the `execute()` method of `src/core/scenarios/scenario-dsl.js` to correctly check for empty arguments array `step.args.length === 0`.

### Proposed Code Diffs

#### File: `src/core/runners/local-runner.js`
```javascript
// Add import at the top
import { wrapExpectation } from '../assertions/assertions.js'

// Update runLocalCitty
export function runLocalCitty(argsOrOptions, options = {}) {
  let finalOptions
  if (Array.isArray(argsOrOptions)) {
    finalOptions = { ...options, args: argsOrOptions }
  } else if (typeof argsOrOptions === 'string') {
    finalOptions = { ...options, args: [argsOrOptions] }
  } else {
    finalOptions = argsOrOptions || {}
  }

  // Validate options with Zod - throws immediately if invalid
  const validated = LocalRunnerOptionsSchema.parse(finalOptions)
  const { cliPath, cwd, env, timeout, args } = validated

  // Resolve CLI path to absolute
  const resolvedCliPath = resolve(cwd, cliPath)

  // Fail-fast: CLI file must exist
  if (!existsSync(resolvedCliPath)) {
    throw new Error(
      `CLI file not found: ${resolvedCliPath}\n` +
      `Expected path: ${cliPath}\n` +
      `Working directory: ${cwd}\n` +
      `Resolved to: ${resolvedCliPath}\n\n` +
      `Possible fixes:\n` +
      `  1. Check the cliPath is correct\n` +
      `  2. Ensure the file exists at the specified location\n` +
      `  3. Use an absolute path: cliPath: '/absolute/path/to/cli.js'\n` +
      `  4. Check your working directory (cwd) is correct`
    )
  }

  const startTime = Date.now()

  // Escape arguments containing spaces
  const escapedArgs = args.map(arg =>
    arg.includes(' ') ? `"${arg}"` : arg
  )

  const fullCommand = `node "${resolvedCliPath}" ${escapedArgs.join(' ')}`

  // Execute - no try-catch, let errors bubble (fail-fast!)
  const stdout = execSync(fullCommand, {
    cwd,
    env: { ...process.env, ...env },
    timeout,
    encoding: 'utf8',
    stdio: ['pipe', 'pipe', 'pipe']
  })

  const durationMs = Date.now() - startTime

  const rawResult = {
    success: true,
    exitCode: 0,
    stdout: stdout.trim(),
    stderr: '',
    args,
    cliPath: resolvedCliPath,
    cwd,
    duration: durationMs,
    durationMs,
    command: fullCommand
  }

  const wrapped = wrapExpectation(rawResult)
  wrapped.result = rawResult
  return wrapped
}

// Update runLocalCittySafe
export function runLocalCittySafe(argsOrOptions, options = {}) {
  let finalOptions
  if (Array.isArray(argsOrOptions)) {
    finalOptions = { ...options, args: argsOrOptions }
  } else if (typeof argsOrOptions === 'string') {
    finalOptions = { ...options, args: [argsOrOptions] }
  } else {
    finalOptions = argsOrOptions || {}
  }

  const validated = LocalRunnerOptionsSchema.parse(finalOptions)
  const { cliPath, cwd, env, timeout, args } = validated

  const resolvedCliPath = resolve(cwd, cliPath)

  if (!existsSync(resolvedCliPath)) {
    const rawResult = {
      success: false,
      exitCode: 1,
      stdout: '',
      stderr: `CLI file not found: ${resolvedCliPath}`,
      args,
      cliPath: resolvedCliPath,
      cwd,
      duration: 0,
      durationMs: 0,
      command: `node "${resolvedCliPath}" ${args.join(' ')}`
    }
    const wrapped = wrapExpectation(rawResult)
    wrapped.result = rawResult
    return wrapped
  }

  const startTime = Date.now()
  const escapedArgs = args.map(arg =>
    arg.includes(' ') ? `"${arg}"` : arg
  )
  const fullCommand = `node "${resolvedCliPath}" ${escapedArgs.join(' ')}`

  try {
    const stdout = execSync(fullCommand, {
      cwd,
      env: { ...process.env, ...env },
      timeout,
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe']
    })

    const durationMs = Date.now() - startTime
    const rawResult = {
      success: true,
      exitCode: 0,
      stdout: stdout.trim(),
      stderr: '',
      args,
      cliPath: resolvedCliPath,
      cwd,
      duration: durationMs,
      durationMs,
      command: fullCommand
    }
    const wrapped = wrapExpectation(rawResult)
    wrapped.result = rawResult
    return wrapped
  } catch (error) {
    const durationMs = Date.now() - startTime
    const rawResult = {
      success: false,
      exitCode: error.status || 1,
      stdout: error.stdout ? error.stdout.toString().trim() : '',
      stderr: error.stderr ? error.stderr.toString().trim() : error.message,
      args,
      cliPath: resolvedCliPath,
      cwd,
      duration: durationMs,
      durationMs,
      command: fullCommand
    }
    const wrapped = wrapExpectation(rawResult)
    wrapped.result = rawResult
    return wrapped
  }
}
```

#### File: `src/core/scenarios/scenario-dsl.js`
```javascript
// Add .run method to builder object inside scenario(name)
    /**
     * Chaining method to run a command for the current step
     * @param {string|string[]} args - Command arguments
     * @param {Object} options - Optional execution options
     * @returns {Object} this for chaining
     */
    run(args, options = {}) {
      if (!currentStep) {
        throw new Error('Must call step() before run()')
      }

      const argsArray = typeof args === 'string'
        ? args.trim().split(/\s+/)
        : Array.isArray(args)
          ? args
          : []

      currentStep.args = argsArray
      currentStep.options = { ...currentStep.options, ...options }

      return this
    },

// Update validations in builder.execute() for both concurrentMode and sequential paths
// Before:
// if (!step.args && !step.action) { ... }
// After:
// if (!step.action && (!step.args || step.args.length === 0)) {
//   throw new Error(`Step "${step.description}" has no command`)
// }
```

---

## 5. Verification Method
1. Run the Vitest test commands:
   - Full suite: `npm test`
   - Specific target unit tests:
     - `npx vitest run test/unit/scenario-dsl.test.mjs`
     - `npx vitest run test/unit/snapshot.test.mjs`
2. Expected outcome:
   - All tests pass (0 failures).
