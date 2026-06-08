## 2026-06-08T02:40:46Z
You are the teamwork_preview_worker for milestone r1.
Your working directory is /Users/sac/citty-test-utils/.agents/worker_r1.
Your task is to implement the Backward-Compatible Runner Signatures (R1) in `src/core/runners/local-runner.js`.

Requirements:
1. Support both the old positional signature `(args, options)` and the new options-object signature `(options)` for `runLocalCitty` and `runLocalCittySafe` in `src/core/runners/local-runner.js`.
2. Map positional array or string arguments to the standard options structure `{ args, ...options }`.
3. Wrap their return results using `wrapExpectation` imported from `../assertions/assertions.js`.
4. Ensure both `duration` and `durationMs` are present in the returned execution result object to support all assertion methods correctly.
5. Verify your changes by running vitest: `npx vitest run test/unit/snapshot.test.mjs` and reporting the output.
6. When done, write a handoff report to /Users/sac/citty-test-utils/.agents/worker_r1/handoff.md detailing the changes and test results, and notify your parent (sub-orchestrator) using send_message.

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A Forensic Auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.
