# Project: citty-test-utils Release v26.6.7 Preparation

## Architecture
- `src/core/runners/local-runner.js`: Contains `runLocalCitty` and `runLocalCittySafe`. We need to support positional args and options-object signatures here.
- `src/core/scenarios/scenario-dsl.js`: Scenario builder DSL. We need to implement/restore `.run()` chaining and step missing command validation.
- `test/`: Vitest test suites (unit, integration, BDD, readme).

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| 1 | E2E Test Suite | Create Category-Partition, BVA, Pairwise, and Workload tests | none | DONE (Conv: bcefc932-25b4-41cb-9093-ed44d8bc7699) |
| 2 | Implementation of R1-R3 & R5 | Implement backward-compatible runner signatures, .run() chaining, step command validation, and R5 Docker requirements | M1 | IN_PROGRESS (Conv: 1f4fa1c0-f09f-4b7a-b6bf-3a346d74869a) |
| 3 | Final Integration Verification | Run and pass 100% of E2E tests, run unit/integration/BDD/readme tests, run forensic audit | M2 | PLANNED |

## Interface Contracts
### runLocalCitty & runLocalCittySafe
- Signature: `(argsOrOptions, options)` where `argsOrOptions` can be array of arguments, string, or options object.
- Returns: Result object wrapped with assertion methods (`expectSuccess`, etc.).

### Scenario DSL Chaining
- Chaining: `.step(name).run(args, options)`
- Validation: Steps without command throw error `Step "<name>" has no command` on execution.

### R5 Docker Dependency
- Local mode execution/imports must NOT check or require Docker.
- Cleanroom tests/operations referencing Docker must hard fail/crash if Docker is unavailable (do not skip/fallback silently). `isCleanroomAvailable()` must throw when cleanroom setup fails.
