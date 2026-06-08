# Scope: E2E Testing Track

## Architecture
- **E2E Test File**: `test/integration/e2e-requirements.test.mjs`
- **Features Tested**:
  1. **R1: Runner Signatures**: Support for positional `(args, options)` and options-object `(options)` on `runLocalCitty` and `runLocalCittySafe`, returning assertions.
  2. **R2: Scenario DSL Chaining**: Chainable `.run(args, options)` on scenario builder (`.step('Name').run('command')`).
  3. **R3: Scenario DSL Validation**: Throwing `"Step <name> has no command"` on execution if step lacks command/action.
- **Data Flow**: Tests call `runLocalCitty` / `runLocalCittySafe` or Scenario builder, which spawns processes or parses scenarios, then returns results. Assertions are chained.

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| 1 | Test Plan & Scope Definition | Decompose user request into 4-tier test cases and create SCOPE.md | None | DONE |
| 2 | Write Test Suite | Spawn teamwork_preview_worker to write e2e-requirements.test.mjs, TEST_INFRA.md, and TEST_READY.md | 1 | DONE |
| 3 | Run and Verify Tests | Run vitest on the new integration test file to verify they compile and fail as expected | 2 | DONE |
| 4 | Reporting & Handoff | Document results in handoff.md and notify parent conversation | 3 | DONE |

## Test Suite Design (38 Test Cases)

### Tier 1: Feature Coverage (15 tests)
1. `runLocalCitty(args, options)` positional signature executes correctly.
2. `runLocalCitty(options)` options-object signature executes correctly.
3. `runLocalCitty(options)` without `args` in options executes with empty args.
4. `runLocalCittySafe(args, options)` positional signature executes correctly.
5. `runLocalCittySafe(options)` options-object signature executes correctly.
6. `runLocalCittySafe(options)` without `args` in options executes with empty args.
7. `runLocalCitty(args, options)` returns wrapped assertions (verify `expectSuccess` works).
8. `runLocalCitty(args, options)` returns wrapped assertions (verify `expectFailure` works).
9. `runLocalCittySafe(options)` returns wrapped assertions (verify `expectOutput` works).
10. `runLocalCittySafe(options)` returns wrapped assertions (verify `expectStderr` works).
11. Scenario DSL `.run(args)` chaining executes successfully with string command.
12. Scenario DSL `.run(args)` chaining executes successfully with array of args.
13. Scenario DSL `.run(args, options)` chaining supports custom options (e.g. `env`).
14. Scenario DSL validation throws `"Step <name> has no command"` on sequential execution when command/action is missing.
15. Scenario DSL validation throws `"Step <name> has no command"` on concurrent execution when command/action is missing.

### Tier 2: Boundary & Corner Cases (15 tests)
16. `runLocalCitty` positional signature with empty array `[]` as `args`.
17. `runLocalCitty` positional signature with null/undefined `args` (throws or handles gracefully).
18. `runLocalCitty` options-object signature with empty/missing `args` option (runs with empty args).
19. `runLocalCitty` options-object signature with non-array `args` (runs by parsing string).
20. `runLocalCittySafe` positional signature with empty array `[]` as `args`.
21. `runLocalCittySafe` options-object signature with empty/missing `args` option (runs with empty args).
22. Scenario DSL calling `.run()` before any `.step()` throws `"Must call step() before run()"`.
23. Scenario DSL `.run()` with empty string command string (runs with empty args).
24. Scenario DSL `.run()` with multiple spaces in command string (e.g., `'cmd   arg1   arg2'`).
25. Scenario DSL step with `action` but no command (does NOT throw `"has no command"`).
26. Scenario DSL step with neither `action` nor command (throws `"Step <name> has no command"`).
27. Scenario DSL step description with special characters (throws error with exact description in message).
28. `runLocalCitty` options-object with non-existent `cliPath` throws missing CLI error.
29. `runLocalCitty` positional with non-existent `cliPath` returns failure result with exitCode 1 and stderr.
30. `runLocalCittySafe` with non-existent `cliPath` returns failure result with exitCode 1 and stderr.

### Tier 3: Cross-Feature Combinations (3 tests)
31. Scenario combining steps that use `.step(name, args)` and steps using `.step(name).run(args)`.
32. Scenario combining step validation errors and concurrent mode execution (valid steps run, but entire scenario fails with the missing command error).
33. Concurrent scenario where multiple steps are missing commands (fails and throws for all/first error).

### Tier 4: Real-World Application Scenarios (5 tests)
34. Multi-step sequential scenario testing a mock CLI's help, version, and error handling, using `.step().run()` chaining, custom env, and assertions.
35. Multi-step concurrent scenario testing multiple CLI operations concurrently using `.step().run()` chaining.
36. Integration test executing actual CLI file (e.g. `./src/cli.mjs` or a playground mock CLI) using both positional and options-object signatures.
37. Scenario DSL test simulating step dependencies (using `lastResult` in action steps) mixed with chained command execution steps.
38. Real-world end-to-end user scenario testing interactive-like CLI workflows (e.g. config generation, file creation, analysis report checking) using the scenario builder, custom actions, and chained run commands.
