## 2026-06-08T03:55:20Z
You are the worker implementing Milestones 1, 2, and 3 of the citty-test-utils implementation track.
Your working directory is /Users/sac/citty-test-utils/.agents/worker_implementation_gen2.
Your parent conversation ID is 09337ee5-2138-4fd9-bb69-4ffeb601023b.

Please perform the following implementations:
1. **Milestone 1 (Backward-Compatible Runner Signatures - R1)**:
   - In `src/core/runners/local-runner.js`, find where `cleanEnv.NODE_ENV` is cleaned up. Add:
     `delete cleanEnv.TEST`
     This prevents `consola` from being silenced during tests run under Vitest.
   - Refactor tests in `test/unit/local-runner.test.mjs` to avoid module-level hoisted mock of `child_process` if it causes leaks or issues, or ensure it is fully clean. (Currently it mocks spawnSync, make sure it is safe).

2. **Milestone 2 (Scenario DSL .run() & Validation - R2, R3)**:
   - In `src/core/scenarios/scenario-dsl.js`, ensure `.run()` chaining is fully functional. Look at `run(args, options)`: it should update the step and return `this` (the builder instance).
   - In `src/core/scenarios/scenario-dsl.js`, ensure validation throws `Error('Step "<description>" has no command')` if neither `action` nor `args` (with elements) is defined. Check both sequential and concurrent execution paths. Note that if `args` is an empty array `[]` (i.e. length is 0), or if `args` is null or undefined, and there is no action, it MUST throw `Error('Step "<description>" has no command')`.

3. **Milestone 3 (Docker Optionality & Hard-Fail - R5)**:
   - Modify `test/setup/shared-cleanroom.mjs`. In `setup()`, if `getSharedCleanroom()` throws an error, catch it and store it in a module-level variable (e.g. `let setupFailedError = error`).
   - In `isCleanroomAvailable()`, if `setupFailedError` is set, throw that error instead of returning `false`. This forces cleanroom tests to hard fail if Docker is unavailable.

4. **Verify Your Work**:
   - Run Vitest tests:
     `npm test` (or `npx vitest run`)
   - Ensure all unit, integration, BDD, and readme tests in the Vitest suite pass with 0 failures.
   - If anything fails, debug and fix it.

DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A Forensic Auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Document the files modified, build/test results, and verify that they pass before writing your handoff report. Report back with the paths of modified files and a summary of your test outcomes.

## 2026-06-08T03:57:59Z
**Context**: Subagent findings for Milestones 1 & 2.
**Content**: Explorer 2 has completed its investigation and highlighted some crucial issues to fix:
1. **Shared Directory Race Condition in `test/integration/e2e-requirements.test.mjs`**: All tests share the exact same directory/file `.test-e2e-requirements/test-cli.mjs`. In concurrent/async test execution, `afterEach` deletes this directory/file while other tests are running, leading to `MODULE_NOT_FOUND` errors. Please update `test/integration/e2e-requirements.test.mjs` to use a unique directory/file path per test (e.g. including the test name or index, or a random string/UUID/timestamp) to resolve this race condition.
2. **`child_process` Mock Leak in `local-runner.test.mjs`**: Ensure you remove the global hoisted `vi.mock('child_process')` and instead use `vi.spyOn` or another clean scoping mechanism to mock `spawnSync` in `test/unit/local-runner.test.mjs`.
3. **Robustness on Malformed Arguments**: Ensure `normalizeOptions` in `local-runner.js` handles cases where `args` is passed inside options as non-iterable or when other primitive arguments are passed.
**Action**: Please integrate these fixes alongside your current tasks for Milestones 1, 2, and 3.
