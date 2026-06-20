# un-test-utils

Zero-config CLI testing for Node.js. Auto-detects local or Docker cleanroom execution.

[![npm version](https://img.shields.io/npm/v/un-test-utils)](https://npmjs.com/package/un-test-utils)
[![npm downloads](https://img.shields.io/npm/dm/un-test-utils)](https://npmjs.com/package/un-test-utils)
[![license](https://img.shields.io/npm/l/un-test-utils)](./LICENSE)

## Install

```bash
npm install -D un-test-utils
pnpm add -D un-test-utils
yarn add -D un-test-utils
```

## Usage

```js
import { scenario } from 'un-test-utils/scenario'

await scenario('CLI smoke test')
  .step('Show help', '--help')
  .expectSuccess()
  .expectOutput(/USAGE/)
  .step('Show version', '--version')
  .expectSuccess()
  .expectOutput(/\d+\.\d+\.\d+/)
  .execute()
```

Set `TEST_RUNNER=cleanroom` to run the same test in an isolated Docker container — no code change needed.

## API

| Export | From | Description |
|---|---|---|
| `scenario(name)` | `un-test-utils/scenario` | Fluent scenario builder. Chain `.step()`, `.expectSuccess()`, `.execute()`. |
| `runCitty(args, opts?)` | `un-test-utils` | Run CLI args. Auto-detects local or cleanroom mode via config / `TEST_RUNNER`. |
| `runLocalCitty(args, opts?)` | `un-test-utils` | Run CLI args locally via `spawnSync`. Returns assertion-wrapped result. |
| `runCittySafe(args, opts?)` | `un-test-utils` | Like `runCitty` but never throws — failed runs return a wrapped error result. |
| `setupCleanroom(opts)` | `un-test-utils` | Spin up a Docker cleanroom container before a test suite. |
| `teardownCleanroom()` | `un-test-utils` | Stop and remove the cleanroom container. |

### Scenario builder methods

| Method | Description |
|---|---|
| `.step(name, args, opts?)` | Add a step. `args` is a string (split on spaces) or `string[]`. |
| `.expectSuccess()` | Assert exit code 0. |
| `.expectFailure()` | Assert non-zero exit code. |
| `.expectOutput(pattern)` | Assert stdout contains string or matches regex. |
| `.expectStderr(pattern)` | Assert stderr contains string or matches regex. |
| `.expectExit(code)` | Assert specific exit code. |
| `.expectJson(fn)` | Parse stdout as JSON and pass to validator function. |
| `.expectSnapshot(name)` | Snapshot-test the full result. |
| `.concurrent()` | Run all steps in parallel instead of sequentially. |
| `.mode('local'\|'cleanroom')` | Override auto-detected execution mode. |
| `.execute()` | Run all steps. Returns `Promise<{ scenario, results, success }>`. |

## Subpath imports

```js
import { scenario, concurrentScenario, localScenario, cleanroomScenario } from 'un-test-utils/scenario'
import { runLocalCitty, runCitty, runCittySafe } from 'un-test-utils/core'
```

| Subpath | Contents |
|---|---|
| `un-test-utils` | All exports re-exported (scenario + runners + coverage) |
| `un-test-utils/scenario` | Scenario DSL (`scenario`, `concurrentScenario`, `localScenario`, `cleanroomScenario`, `scenarioTemplates`) |
| `un-test-utils/core` | Core assertions and `runLocalCitty` / `runCitty` runners |

## Environment variables

| Variable | Default | Description |
|---|---|---|
| `TEST_RUNNER` | `local` | Set to `cleanroom` to use Docker execution. |
| `TEST_CLI_PATH` | `./src/cli.mjs` | Path to the CLI entry point under test. |
| `TEST_CWD` | `process.cwd()` | Working directory for CLI execution. |

## License

MIT
