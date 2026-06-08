# Handoff Report: Milestone 1: Implement Backward-Compatible Runner Signatures (R1)

## 1. Observation
Direct observations of the codebase and test files:

### A. Position and Option Signatures
In `/Users/sac/citty-test-utils/src/core/runners/local-runner.js`, the signature normalization is implemented as follows:
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

### B. Result Wrapping and JSON Parsing
In `/Users/sac/citty-test-utils/src/core/runners/local-runner.js` lines 146-157:
```javascript
export function wrapWithAssertions(result) {
  const wrapped = wrapExpectation(result)
  wrapped.result = result
  wrapped.durationMs = result.durationMs
  wrapped.duration = result.duration
  
  if (!('json' in wrapped)) {
    Object.defineProperty(wrapped, 'json', { 
      get() { try { JSON.parse(result.stdout); return destr(result.stdout) } catch { return undefined } },
      configurable: true, enumerable: true
    })
  }
```

In `/Users/sac/citty-test-utils/src/core/assertions/assertions.js` lines 44-54:
```javascript
    expectJson(fn) {
      let json
      try {
        JSON.parse(result.stdout)
        json = destr(result.stdout)
      } catch (e) {
        throw new Error('Expected valid JSON output')
      }
      if (fn) fn(json)
      return this
    },
```

### C. Child Process Mocking Leak
In `/Users/sac/citty-test-utils/test/unit/local-runner.test.mjs` lines 7-18:
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

### D. Missing CLI File Inconsistent Handling
In `/Users/sac/citty-test-utils/src/core/runners/local-runner.js` lines 93-104:
```javascript
  if (!existsSync(resolvedCliPath)) {
    const errorMsg = `CLI file not found: ${resolvedCliPath}
Possible fixes:
1. Ensure the file exists at the specified path.
2. Check the working directory.
Expected path: ${resolvedCliPath}
Working directory: ${cwd}`

    const res = { success: false, exitCode: 1, stdout: '', stderr: errorMsg, args, cliPath: resolvedCliPath, cwd, durationMs: 0, duration: 0, command: 'unknown' }
    if (isPositional) return wrapWithAssertions(res)
    throw new Error(errorMsg)
  }
```

### E. Vitest CLI command execution and results
Running `npm run test:unit` executes Vitest successfully:
```bash
npx vitest run test/unit
```
Resulting in:
```
 Test Files  9 passed (9)
      Tests  245 passed (245)
```

---

## 2. Logic Chain
Step-by-step reasoning from observations to conclusion:

1. **R1 Compliance Verification**:
   - `normalizeOptions` (Observation A) maps `(firstArg, secondArg)` inputs correctly. It handles cases where arguments are passed as an array or string (positional) alongside an options object, or just a single options-object. It also normalizes string arguments by splitting them on whitespace `split(/\s+/)`.
   - `wrapWithAssertions` (Observation B) successfully decorates the result object with the required helper assertions (such as `expectSuccess`), and exposes both `duration` and `durationMs` to the returned wrapped object and nested `result` object, matching interface requirements.
   - Therefore, the core of `runLocalCitty` complies with backward-compatible signatures.

2. **JSON Parsing & Getter Verification**:
   - Initially, the tests failed when using `destr` directly on invalid JSON strings because `destr` returns the input string rather than throwing or returning `undefined`.
   - The updated codebase now utilizes `JSON.parse` inside a try-catch block in both `assertions.js`'s `expectJson` (Observation B) and `local-runner.js`'s `json` getter (Observation B) to validate JSON validity. This correctly throws an Error or returns `undefined` for invalid JSON, which makes it pass the unit tests.

3. **Child Process Mock Leak**:
   - The module-level `vi.mock('child_process', ...)` (Observation C) overrides the `child_process` module inside the Vitest process.
   - Because `vitest.config.mjs` executes tests in a single fork process sequentially (`singleFork: true`), this mock leaks into other test suites (e.g., `local-runner-refactored.test.mjs` and `unified-runner.test.mjs`).
   - However, since `globalThis.__mockSpawnSync` is cleared in `afterEach` and the mock delegates to `actual.spawnSync` when the global is absent, the execution of real child processes in subsequent tests is not blocked. Nonetheless, it represents a structural leak.

4. **Edge Cases & Inconsistencies**:
   - **`args` non-iterable**: If `args` is passed inside an options object as a number (e.g., `{ args: 123 }`), it bypasses type validation and causes a raw `TypeError: args is not iterable` during the spread operation (`...args`) inside `runLocalCitty` (Observation A).
   - **CLI existence check differential behavior**: When the target CLI file is missing, `runLocalCitty` returns a wrapped failed result if the call used a positional signature (`isPositional`), but throws an Error if called with an options-object signature (Observation D). This behavior is asymmetrical and could surprise clients expecting uniform behavior.

---

## 3. Caveats
- Checked only local runner tests; docker cleanroom environment behavior (Milestone 3 / R5) was not audited for Docker host prerequisites or test suite dependencies.
- Assumed standard Node.js/Vitest execution environments.
- Execution concurrency is synthetically sequentially blocked because `runLocalCitty` uses `spawnSync` synchronously.

---

## 4. Conclusion
The implementation of backward-compatible runner signatures (R1) in `src/core/runners/local-runner.js` is **fully functional and compliant** with all specified R1 interface contracts. The previous test failures related to `expectJson` and the `json` getter have been resolved via strict JSON validation before calling `destr`. The only remaining concerns are:
1. Module-level `child_process` mocking leak in `local-runner.test.mjs` (which could be resolved by using cleaner spying such as `vi.spyOn`).
2. Edge cases around non-iterable `args` options and asymmetrical file existence throwing behavior.

---

## 5. Verification Method
To independently verify:
1. Run the Vitest unit tests:
   ```bash
   npm run test:unit
   ```
   All 245 tests should pass.
2. Inspect the file `src/core/runners/local-runner.js` to confirm normalization signatures and result wrapping structure.
3. Check `test/unit/local-runner-refactored.test.mjs` block `Backward-Compatible Signatures (R1)` (lines 632-681) to verify all signature variants are covered.
