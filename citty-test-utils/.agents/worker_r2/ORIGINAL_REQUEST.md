## 2026-06-08T03:59:50Z
You are the teamwork_preview_worker for milestone r2.
Your working directory is /Users/sac/citty-test-utils/.agents/worker_r2.

Your task is to:
1. Restore/implement the Scenario DSL `.run(args, options)` chaining method on the scenario builder in `src/core/scenarios/scenario-dsl.js` (R2).
2. Ensure correct validation and error raising in Scenario DSL (R3) so that steps missing a command (neither `args` nor custom `action` specified) raise a `"Step <name> has no command"` error instead of an expectation error during execution.
3. Investigate the failure of test 23 in `test/integration/e2e-requirements.test.mjs` (`should throw validation error when Scenario DSL run is called with empty string command` or similar) and ensure all 38 tests in `test/integration/e2e-requirements.test.mjs` pass.
4. Ensure all unit and integration tests (including the vitest suite) pass. Remember to run vitest with `TEST=false` in the environment if needed to avoid silent consola outputs.
5. When done, write a handoff report to /Users/sac/citty-test-utils/.agents/worker_r2/handoff.md detailing the changes and test outcomes, and notify your parent (sub-orchestrator) using send_message.

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A Forensic Auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.
