# Handoff Report: Milestone 1 - Runner Signatures (R1) Investigation

## 1. Observation

During our investigation of `src/core/runners/local-runner.js`, `test/unit/local-runner.test.mjs`, and related integration/E2E test files, we observed three distinct issues and verified R1 requirement compliance.

### Observation A: Compliance of `runLocalCitty` & `runLocalCittySafe` Signatures
The current implementation of `normalizeOptions` in `src/core/runners/local-runner.js` handles arguments successfully:
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
All unit tests targeting these signatures under `test/unit/local-runner-refactored.test.mjs` pass:
- `should support runLocalCitty with old positional signature (args as array, options)`
- `should support runLocalCitty with old positional signature (args as string, options)`
- `should support runLocalCittySafe with old positional signature (args as array, options)`
- `should support runLocalCittySafe with old positional signature (args as string, options)`
- `should support runLocalCitty with positional signature and no options`

### Observation B: inherited `process.env.TEST` Silencing `consola` Output
When executing tests via Vitest, we observed that `test/integration/e2e-requirements.test.mjs` Test 36 failed:
```
 FAIL  test/integration/e2e-requirements.test.mjs > E2E Requirements Validation Suite > Tier 4: Real-World Application Scenarios > 36. should execute actual project CLI using both positional and options-object signatures
AssertionError: expected '' to contain '1.0.0'

- Expected
+ Received

- 1.0.0
```
Running `node -e "import('./src/core/runners/local-runner.js').then(m => m.runLocalCitty(['--show-version'], { cliPath: './src/cli.mjs' })).then(console.log)"` directly in the shell successfully returned `stdout: '1.0.0'`.
However, running with `TEST=true` set in the environment:
`TEST=true node -e "import('./src/core/runners/local-runner.js').then(m => m.runLocalCitty(['--show-version'], { cliPath: './src/cli.mjs' })).then(console.log)"`
produced an empty `stdout: ''` and `stderr: ''` because `consola` detects `process.env.TEST === 'true'` and silences its output.

### Observation C: child_process Mock Leak
In `test/unit/local-runner.test.mjs`, `child_process` is mocked at the module level:
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
Since `vi.mock()` is hoisted, the mock affects the entire Vitest worker thread, causing any other tests executing concurrently or in the same worker pool to use the mocked version of `spawnSync` instead of the real one, unless isolated.

### Observation D: ReferenceError `destr` is not defined in `smart-cli-detector.js`
When running `npx vitest run test/integration/cli-entry-resolver.test.mjs`, the following test fails:
```
 FAIL  test/integration/cli-entry-resolver.test.mjs > CLI Entry Point Resolver > resolveCLIEntry (convenience function) > should fall back to auto-detection
Error: Smart CLI detection failed: Failed to read package.json at /Users/sac/citty-test-utils/package.json: destr is not defined
 ❯ SmartCLIDetector.detectCLI src/core/utils/smart-cli-detector.js:103:13
```
Looking at `src/core/utils/smart-cli-detector.js`, `destr` is called on line 201:
```javascript
  readPackageJson(packageJsonPath) {
    try {
      const content = readFileSync(packageJsonPath, 'utf8')
      return destr(content)
    } catch (error) {
```
but it is never imported at the top of the file.

---

## 2. Logic Chain

1. **R1 Signature Compliance**: The parameter normalization in `local-runner.js` successfully transforms all backward-compatible signatures `(argsOrOptions, options)` into a standardized options structure. The returned results are wrapped using `wrapWithAssertions` which integrates the assert methods from `assertions.js`. Thus, the core implementation is compliant with R1.
2. **inherited TEST Variable**: Vitest sets `process.env.TEST = 'true'`. `runLocalCitty` cleans up several env vars (e.g. `VITEST`, `NODE_OPTIONS`), but it does not delete `TEST`. The spawned child process inherits `TEST = 'true'`, which causes `consola` to run in a mock/silent test mode. Since the main entry point `src/cli.mjs` uses `consola.log()` to output the version and help messages, no stdout or stderr is printed, causing Test 36 in `e2e-requirements.test.mjs` and README tests to fail. Deleting `cleanEnv.TEST` in `local-runner.js` will resolve this issue.
3. **Mock Leak**: Global `vi.mock('child_process')` changes `spawnSync` to a `vi.fn()` mock wrapper globally. While it delegates to `actual.spawnSync` when `globalThis.__mockSpawnSync` is absent, it accumulates mock calls, which can cause memory leaks, test ordering issues, or pollution of expectations in other tests.
4. **ReferenceError**: `smart-cli-detector.js` parses JSON content using `destr()` but lacks the `import { destr } from 'destr'` statement, resulting in a runtime `ReferenceError` when auto-detecting.

---

## 3. Caveats

- We assumed that `consola` is the only package silencing itself based on `process.env.TEST`. Other packages check `NODE_ENV`, which is correctly mapped to `'development'` in the environment cleanup.
- We assumed tests are run in Vitest's default thread pool mode. If run in isolated processes (`forks`), the child_process mock leak is mitigated, but it still exists for threads.

---

## 4. Conclusion

The current implementation of `local-runner.js` successfully complies with R1 signature requirements. However, the following three fixes are needed to resolve integration test failures and prevent side-effects:
1. **Clean up `TEST` env var**: Add `delete cleanEnv.TEST` in `src/core/runners/local-runner.js` where other test environment variables are removed.
2. **Import `destr`**: Add `import { destr } from 'destr'` at the top of `src/core/utils/smart-cli-detector.js`.
3. **Refactor Mocking**: Modify `test/unit/local-runner.test.mjs` to avoid using global hoisted `vi.mock('child_process')` if possible, or ensure it is fully cleaned up or scoped.

---

## 5. Verification Method

To verify these issues independently:
1. Run the test suite:
   ```bash
   npx vitest run test/integration/e2e-requirements.test.mjs
   ```
   *Expectation:* Test 36 fails with empty stdout.
2. Run the resolver test:
   ```bash
   npx vitest run test/integration/cli-entry-resolver.test.mjs
   ```
   *Expectation:* The auto-detect fallback test fails with `destr is not defined`.
3. Check `src/core/utils/smart-cli-detector.js` imports to confirm the absence of `destr`.
