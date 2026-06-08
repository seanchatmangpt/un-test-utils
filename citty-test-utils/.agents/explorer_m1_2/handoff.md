# Handoff Report — Explorer 2 (Milestone 1)

## 1. Observation

### Observation A: Backward-Compatible Runner Signatures (R1) Implementation
In `src/core/runners/local-runner.js`, the runner functions `runLocalCitty` and `runLocalCittySafe` accept two arguments:
```javascript
export function runLocalCitty(firstArg, secondArg) {
  const isPositional = Array.isArray(firstArg) || typeof firstArg === 'string'
  let options
  try {
    options = normalizeOptions(firstArg, secondArg)
  } catch (err) {
    if (isPositional) {
      const res = { success: false, exitCode: 1, stdout: '', stderr: err.message, args: [], cliPath: '', cwd: process.cwd(), durationMs: 0, duration: 0, command: 'unknown' }
      return wrapWithAssertions(res)
    }
    throw err
  }
```
And the helper `normalizeOptions` (lines 12–25):
```javascript
function normalizeOptions(firstArg, secondArg) {
  if (secondArg !== undefined) {
    if (firstArg === null || firstArg === undefined) {
      throw new TypeError('Command arguments must be a string or an array of strings')
    }
    return { ...secondArg, args: typeof firstArg === 'string' ? (firstArg.trim() === '' ? [] : firstArg.trim().split(/\s+/)) : firstArg }
  }
  if (Array.isArray(firstArg) || typeof firstArg === 'string') {
    return { args: typeof firstArg === 'string' ? (firstArg.trim() === '' ? [] : firstArg.trim().split(/\s+/)) : firstArg }
  }
  const opts = { ...(firstArg || {}) }
  if (opts.args && typeof opts.args === 'string') opts.args = opts.args.trim().split(/\s+/)
  return opts
}
```

### Observation B: Silent `expectJson` and `json` Getter Failures on Invalid JSON
In `src/core/assertions/assertions.js`, `expectJson` parses standard output:
```javascript
    expectJson(fn) {
      let json
      try {
        json = destr(result.stdout)
      } catch (e) {
        throw new Error('Expected valid JSON output')
      }
      if (fn) fn(json)
      return this
    },
```
And in `src/core/runners/local-runner.js` (lines 152–157):
```javascript
  if (!('json' in wrapped)) {
    Object.defineProperty(wrapped, 'json', { 
      get() { try { return destr(result.stdout) } catch { return undefined } },
      configurable: true, enumerable: true
    })
  }
```
However, in Node.js/Vitest, `destr` package v2.x defaults to non-strict mode, meaning `destr("not json")` returns `"not json"` and does **not** throw an error (demonstrated by scratch script test: `Result: not json`). Thus, the `catch` blocks are never executed.
This causes two unit tests in `test/unit/local-runner-refactored.test.mjs` to fail under a clean (unmocked) run:
- `should throw expectJson for invalid JSON` (Line 386)
- `should return undefined for invalid JSON in json getter` (Line 407)

Verbatim test errors when mock is not active:
```
 FAIL  test/unit/local-runner-refactored.test.mjs > Local Runner Unit Tests > wrapWithAssertions > should throw expectJson for invalid JSON
AssertionError: expected [Function] to throw an error

 FAIL  test/unit/local-runner-refactored.test.mjs > Local Runner Unit Tests > wrapWithAssertions > should return undefined for invalid JSON in json getter
AssertionError: expected 'Test CLI v1.0.0\nUsage: test-cli [com…' to be undefined
```

### Observation C: `child_process` Mock Leak in `local-runner.test.mjs`
In `test/unit/local-runner.test.mjs` (lines 7–18):
```javascript
vi.mock('child_process', async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    spawnSync: vi.fn((...args) => {
      if (globalThis.__mockSpawnSync) {
        return globalThis.__mockSpawnSync(...args)
      }
      return actual.spawnSync(...args)
    })
  }
})
```
This is a module-level mock which gets loaded globally in Vitest worker threads. When other test files are run in the same worker thread, their imports of `child_process` resolve to this mocked version.
If `globalThis.__mockSpawnSync` is defined concurrently by another running test, the call is hijacked. If it is undefined, calling the mock function can still interfere with the test sequence or pollute test spies (e.g. `expect(spawnSync).toHaveBeenCalledTimes(...)`).

### Observation D: Shared Test Directory Race Condition in `e2e-requirements.test.mjs`
In `test/integration/e2e-requirements.test.mjs` (lines 18–26, 73–78):
```javascript
  const testDir = join(process.cwd(), '.test-e2e-requirements')
  const testCliPath = ...
  
  beforeEach(() => {
    ...
    writeFileSync(testCliPath, testCliContent, { mode: 0o755 })
  })

  afterEach(() => {
    const dir = dirname(testCliPath)
    if (existsSync(dir)) {
      rmSync(dir, { recursive: true, force: true })
    }
  })
```
All 38 integration tests share the exact same `.test-e2e-requirements/test-cli.mjs` path. When executed concurrently (or during interleaved microtask cycles), one test's `afterEach` hook deletes the directory/file while another test is in the middle of executing scenario steps, causing a `MODULE_NOT_FOUND` error in the child process:
```
Error: Expected exit code 0, got 1
Command: node "/Users/sac/citty-test-utils/.test-e2e-requirements/test-cli.mjs" --json
Stderr: node:internal/modules/cjs/loader:1148
  throw err;
  ^
Error: Cannot find module '/Users/sac/citty-test-utils/.test-e2e-requirements/test-cli.mjs'
```

---

## 2. Logic Chain

1. **R1 Compatibility**:
   - The signatures in `local-runner.js` match `(firstArg, secondArg)` where `firstArg` can be an array, string, or options object.
   - However, edge cases are not guarded: if `firstArg` is an options object with `args` as a non-iterable value, or if `secondArg` is a primitive, it can result in unhandled `TypeError`s during destructuring or execution.

2. **JSON Safe Parsing**:
   - `expectJson()` and `json` getter try-catch blocks are meant to intercept invalid JSON by calling `destr(stdout)`.
   - Since `destr` by default returns the input string if parsing fails, it does not throw.
   - As a result, the `try-catch` block is bypassed, failing to throw on invalid JSON or return `undefined` for `wrapped.json`.
   - The proposed fix is to either use `safeDestr` (which enforces strict mode and throws on invalid JSON) or attempt standard `JSON.parse` inside the `try` block before returning the destr value.

3. **Vitest Mock Leaks**:
   - Module-level mocks in Vitest persist across test files executed in the same worker pool.
   - The global mock of `child_process` in `local-runner.test.mjs` intercepts all `spawnSync` calls made by subsequent/concurrent tests in the same thread.
   - This causes integration tests (like `citty-integration.test.mjs`) to sometimes receive empty outputs when they run in the same worker thread as `local-runner.test.mjs`.
   - The proposed fix is to avoid global `vi.mock` at the module level for native modules in test files, or use `vi.spyOn` on the native module imports inside `beforeEach` and `vi.restoreAllMocks()` in `afterEach`.

4. **Race Conditions**:
   - Shared paths across tests in `e2e-requirements.test.mjs` lead to file deletions by the `afterEach` hook of finished tests while other tests are running their asynchronous steps.
   - Resolving this requires generating unique directory/file names per test (e.g. using a timestamp, UUID, or test index) instead of hardcoding `.test-e2e-requirements/test-cli.mjs`.

---

## 3. Caveats

- We assumed that `destr` was intended to be used in strict mode. If the designers wanted lenient parsing, they should not have written try-catch blocks that expect it to throw on invalid JSON.
- We assumed that Vitest is configured to run tests sequentially, but due to Vitest's async task scheduling and worker thread reuse, mock leak and file path sharing still result in interleaving issues.

---

## 4. Conclusion

The current implementation of `local-runner.js` supports the backward-compatible signatures (R1) successfully but suffers from:
1. A **major bug** where `expectJson` and the `json` getter do not throw/return undefined on invalid JSON because `destr` is safe and non-throwing by default.
2. A **mock leak** in `local-runner.test.mjs` that pollutes `child_process` across tests.
3. An **integration test race condition** in `e2e-requirements.test.mjs` due to a shared mock CLI file path.

---

## 5. Verification Method

To verify these findings independently:
1. Run `npx vitest run test/unit/local-runner-refactored.test.mjs` alone. It should pass because the `child_process` mock is not loaded.
2. Run `npx vitest run test/unit/local-runner.test.mjs` alone. It will fail on `should handle invalid JSON gracefully` because `expectJson()` does not throw.
3. Run the full suite via `npm test` or `npx vitest run`. You will observe multiple failures in `citty-integration.test.mjs` and `e2e-requirements.test.mjs` due to mock leaks and path race conditions.
