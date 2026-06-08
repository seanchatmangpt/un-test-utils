# Scope: Implementation Track for citty-test-utils v26.6.7

## Architecture
The `citty-test-utils` library provides a testing harness and scenario DSL for testing Citty-based CLIs.
- **Runners (`src/core/runners/`)**: Executes CLIs locally or in cleanroom environments. We will modify `local-runner.js` to support positional `args` arrays in addition to option objects, and wrap outcomes in standard expectation helpers.
- **Scenario DSL (`src/core/scenarios/`)**: Exposes a builder interface to construct multi-step scenarios. We will modify `scenario-dsl.js` to implement `.run()` chaining and proper validation for commandless steps.
- **Assertions (`src/core/assertions/`)**: Reusable expectation functions. `wrapExpectation` wraps raw runner execution results with assertion methods.

## Milestones
| # | Name | Scope | Dependencies | Status | Conversation ID |
|---|------|-------|--------------|--------|-----------------|
| 1 | Backward-Compatible Runner Signatures (R1) | Update `local-runner.js` to accept `(argsOrOptions, options)` and wrap results in `wrapExpectation` | None | IN_PROGRESS | 407e6b6a-1557-4ba5-959e-9fc4be20117f |
| 2 | Scenario DSL .run() & Validation (R2, R3) | Implement `.run()` chaining and fix "no command" validation in `scenario-dsl.js` | M1 | PLANNED | TBD |
| 3 | Docker Optionality & Hard-Fail (R5) | Ensure Docker is not required for local mode. Force cleanroom tests to hard fail if Docker is unavailable (throw in `isCleanroomAvailable`). | M2 | PLANNED | TBD |
| 4 | E2E Suite & Adversarial Hardening (Tier 5) | Wait for `TEST_READY.md`, verify all tests pass (including E2E and unit/integration/BDD), and generate adversarial test coverage | M3 | PLANNED | TBD |

## Interface Contracts
### `runLocalCitty` / `runLocalCittySafe` (runners ↔ assertions)
- **Signatures**:
  - `(options: LocalRunnerOptions)`
  - `(args: string[], options?: LocalRunnerOptions)`
- **Return Type**: Object containing execution result (`success`, `exitCode`, `stdout`, `stderr`, `duration`, `durationMs`, etc.) wrapped by `wrapExpectation`.
- **Validation**: Positional array or string inputs are mapped to the standard Zod schema shape `{ args, ...options }`.

### Scenario DSL Builder (dsl ↔ runners)
- **Chaining method**: `.run(args: string | string[], options?: Object)` updates current step's command and returns the builder instance (`this`).
- **Validation**: Step execution throws `Error('Step "<description>" has no command')` if neither `action` nor `args` (with elements) is defined.

### Docker Dependency (R5)
- Local mode imports and runs must NOT require Docker.
- Cleanroom tests/operations referencing Docker must hard fail if Docker is not available in the environment.
- Modify `isCleanroomAvailable()` in `test/setup/shared-cleanroom.mjs` to throw an error if called when cleanroom setup fails, causing tests attempting cleanroom runs to fail instead of skipping.
