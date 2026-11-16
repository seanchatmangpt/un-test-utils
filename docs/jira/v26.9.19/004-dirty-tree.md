# un-test-utils: commit or clean uncommitted changes

- Standing: OPEN
- Created: 2026-09-19 (v26.9.19 gh survey wave)
- Source: working tree dirty at survey time
- Evidence: `git status --porcelain` → 302 path(s) (tracked-modified: 302, untracked: 0); sample:  D .agents/ORIGINAL_REQUEST.md; D .agents/auditor_r1/BRIEFING.md; D .agents/auditor_r1/ORIGINAL_REQUEST.md;

## Work to complete
- Review the 302 tracked-modified path(s); commit them as atomic pieces on a purpose branch, or revert what is transient.
- Note: this survey's ticket files under docs/jira/v26.9.19/ are intentionally uncommitted; include or exclude them deliberately in the commit plan.

## Acceptance
- `git status --porcelain` is clean (except items deliberately deferred and recorded here).

## History
- 2026-09-19 | OPEN | survey found dirty tree | 302 paths (T302/U0) | commit/clean pending
