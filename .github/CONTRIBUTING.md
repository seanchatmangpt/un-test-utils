# Contributing to citty-test-utils

Thank you for taking the time to contribute. This document covers everything needed to go from zero to a merged pull request.

## Prerequisites

- **Node.js** >= 18.0.0 (Node 20 LTS recommended)
- **Docker** — required only for cleanroom/testcontainers tests; local unit tests run without it
- **npm** >= 9

## Getting Started

```bash
# Clone and install
git clone https://github.com/seanchatmangpt/citty-test-utils.git
cd citty-test-utils
npm install
```

## Running Tests

| Command | What it runs |
|---|---|
| `npm test` | All tests (vitest run) |
| `npm run test:unit` | Unit tests only (`test/unit/`) |
| `npm run test:integration` | Integration tests (requires Docker for cleanroom suite) |
| `npm run test:cleanroom` | Cleanroom isolation tests (requires Docker) |
| `npm run test:coverage` | Full suite with V8 coverage report |
| `npm run test:watch` | Watch mode for local development |

Tests that require Docker are guarded with `skipIf(!(await isDockerAvailable()), 'Docker not running')` and will be skipped gracefully if Docker is unavailable.

## Submitting a Pull Request

1. **Fork** the repository and create a branch from `main`:
   ```bash
   git checkout -b feat/my-feature
   ```

2. **Write tests first.** This project follows TDD — new behaviour must be covered by a test in `test/unit/` or `test/integration/` before the implementation lands.

3. **Keep files under 500 lines.** Split modules if needed.

4. **Lint and type-check** before pushing:
   ```bash
   npm run lint       # if configured
   npm run typecheck  # if configured
   ```

5. **Commit** using [Conventional Commits](https://www.conventionalcommits.org/):
   - `feat(scope): add skipIf helper to scenario DSL`
   - `fix(cleanroom): surface DockerUnavailableError within 5 s`
   - `chore(deps): bump zod to v4`

6. **Open a PR** against `main`. Fill in the template:
   - What problem does this solve?
   - How was it tested?
   - Any breaking changes?

7. A maintainer will review within a few business days. CI must be green before merge.

## Code Style

- ESM-first (`"type": "module"` in package.json) — use `.mjs` extension or `import`/`export` syntax.
- No default exports from utility modules — use named exports.
- Prefer `pathe` over Node's `path` for cross-platform path handling.

## Reporting Bugs

Open an issue at <https://github.com/seanchatmangpt/citty-test-utils/issues> with:
- citty-test-utils version (`npm list citty-test-utils`)
- Node.js version (`node --version`)
- Docker version if relevant (`docker --version`)
- Minimal reproduction script

## License

By contributing you agree that your contributions will be licensed under the project's [MIT License](../LICENSE).
