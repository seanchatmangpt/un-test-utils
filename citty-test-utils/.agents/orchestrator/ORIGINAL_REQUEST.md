# Original User Request

## 2026-06-08T02:32:44Z

Prepare the `citty-test-utils` library for v26.6.7 release by running all tests, identifying broken or unimplemented capabilities, and finishing their implementation.

Working directory: `/Users/sac/citty-test-utils`
Integrity mode: benchmark

## Requirements

### R1. Backward-Compatible Runner Signatures
Support both the old positional signature `(args, options)` and the new options-object signature `(options)` for `runLocalCitty` and `runLocalCittySafe`. Ensure they return a result wrapped with assertions (e.g. `expectSuccess()`).

### R2. Scenario DSL `.run()` Chaining
Restore and implement the `.run(args, options)` chaining method on the scenario builder, allowing steps to be declared and executed via `.step('Name').run('command')`.

### R3. Correct Validation and Error Raising in Scenario DSL
Ensure that steps missing a command (neither `args` nor custom `action` specified) raise a `"Step <name> has no command"` error instead of an expectation error during execution.

### R4. Complete Test Suite Success
All unit, BDD, and integration tests in the Vitest suite must pass successfully.

## Acceptance Criteria

### Execution & Compatibility
- [ ] Running `npm test` passes all tests with 0 failures.
- [ ] `runLocalCitty` handles positional arguments array `['--help']` as the first argument.
- [ ] Scenario steps chaining `.step('step').run('args')` execute successfully.
- [ ] Steps with missing commands throw `has no command` error.

## Follow-up — 2026-06-08T02:46:03Z

Hello Orchestrator,

The user has added a new requirement (R5) and a subsequent correction to it:
1. Docker should NOT be a requirement for importing, using, or running the library in local mode.
2. However, cleanroom tests or operations referencing Docker MUST still hard fail/crash if Docker is not available in the environment (do NOT skip them or fallback silently).

Please update your milestone plan and implement this requirement accordingly. The verbatim updates have also been appended to `/Users/sac/citty-test-utils/.agents/ORIGINAL_REQUEST.md`.
