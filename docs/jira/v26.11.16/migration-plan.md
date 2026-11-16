# un-test-utils migration plan v26.11.16

Standing: UNVERIFIED

## Identity
- Path: /Users/sac/un-test-utils
- Remote: https://github.com/seanchatmangpt/un-test-utils.git (upstream origin/main)
- Branch@sha: main@dbb04c2
- Last commit: 2026-06-19; commits: 76; size: 44 MB
- Languages/build: Node (package.json, pnpm-workspace.yaml, build.config.ts, vitest), Justfile
- Nested repos: none

## Observed state
- Dirty: 302 — ALL deletions: citty-test-utils/ 149, .claude/ 79, .agents/ 74 (old package
  name dir and agent scaffolding removed from the working tree)
- Untracked: 5 — docs/ (jira) and a few root files
- Ahead of origin/main: 75 commits UNPUSHED. Behind: 0.
- Stash: 3. Unpushed local branches: 10 (worktree-wf_7f31842f-574-1..10, "Auto-snapshot
  before worktree cleanup").
- Local data: ruvector.db, agentdb.rvf (+ .lock), hive/, memory/, scratch/, src-backup/
- Build/dep dirs: no node_modules. tsconfig.tsbuildinfo, *.log present.
- Submodules: none

## What it is
un-test-utils: zero-config CLI testing for Node.js, auto-detecting local or Docker cleanroom
execution. Published to npm; successor of citty-test-utils.

## Classification
WARM — matches census (last commit 2026-06-19).

## Migration risk
HIGH. 75 unpushed commits on main (the 10-agent merge wave) plus 10 unpushed worktree
snapshot branches and 3 stashes. The 302 deletions are intentional cleanup. Local
ruvector.db / agentdb.rvf are agent memory stores (DECISION whether to keep).

## Recommended action
COMMIT-PUSH
1. `cd /Users/sac/un-test-utils && git log origin/main..main --oneline | wc -l` (expect 75).
2. `git push origin main` — DECISION: this publishes the 10-agent merge; confirm it is wanted
   on origin/main or push to `git push origin main:wip/10-agent-merge` instead.
3. Commit the deletions: `git add -A && git commit -m "chore: drop citty-test-utils, .claude, .agents scaffolding" && git push`
4. Worktree branches: `git push --all origin` or DECISION to drop them (they are idle
   auto-snapshots: `git branch -D worktree-wf_7f31842f-574-{1..10}`).
5. Stashes (3): inspect with `git stash show -p stash@{N}`; apply/commit or drop.
6. Local DBs: DECISION — `rsync -a ruvector.db agentdb.rvf hive memory /Volumes/<archive>/un-test-utils-data/`
   if agent memory matters; otherwise ignore (they are gitignored scratch).
7. Cleanup: `rm -rf node_modules src-backup scratch temp-test-config *.log tsconfig.tsbuildinfo`
8. Re-clone on the new machine.

## First commands on the new machine
`git clone https://github.com/seanchatmangpt/un-test-utils.git && cd un-test-utils && pnpm install && pnpm test`

## See Also
- ../v26.9.19/
- /Users/sac/docs/jira/v26.11.16/README.md
