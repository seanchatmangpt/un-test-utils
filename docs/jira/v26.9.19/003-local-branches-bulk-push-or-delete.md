# un-test-utils: triage 10 local-only branches

- Standing: OPEN
- Created: 2026-09-19 (v26.9.19 gh survey wave)
- Source: local branches with commits not on `origin/main` and no upstream
- Evidence: `git rev-list --count origin/main..<branch>` > 0 for each: worktree-wf_7f31842f-574-1:2 worktree-wf_7f31842f-574-10:2 worktree-wf_7f31842f-574-2:2 worktree-wf_7f31842f-574-3:2 worktree-wf_7f31842f-574-4:2 worktree-wf_7f31842f-574-5:2 worktree-wf_7f31842f-574-6:2 worktree-wf_7f31842f-574-7:2 worktree-wf_7f31842f-574-8:2 worktree-wf_7f31842f-574-9:2

## Work to complete
- Triage each branch: push (`git push -u origin <branch>`) or delete after confirming the commits are obsolete/recoverable. Batch the work; record decisions in History.

## Acceptance
- Every listed branch is pushed or deleted; no local-only branch with unique commits remains.

## History
- 2026-09-19 | OPEN | survey found 10 local-only branches | full list above | triage pending
