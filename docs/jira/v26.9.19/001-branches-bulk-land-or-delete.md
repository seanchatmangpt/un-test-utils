# un-test-utils: triage 20 PR-less unmerged remote branches

- Standing: OPEN
- Created: 2026-09-19 (v26.9.19 gh survey wave)
- Source: origin branches not merged into `main` with no open PR
- Evidence: `git branch -r --no-merged origin/main`: claude/upbeat-faraday-juuiig worktree-agent-a33555c6feb11f0aa worktree-agent-a3fc4d407dba4e8a3 worktree-agent-a5960cc2657fc16ad worktree-agent-a61032e31da6b5b43 worktree-agent-a91188255eeab624f worktree-agent-a922fe56406c7944a worktree-agent-a9a2882e7a619f39b worktree-agent-aa257e4bde8ee5c5f worktree-agent-aa60eafbbccf4a7f4 worktree-agent-ab150466530322a15 worktree-agent-aba6544e0b665e0a4 worktree-agent-ac653af5bc72f075f worktree-agent-ae14dbab7c5d20263 worktree-agent-ae163750754d8bb6e worktree-agent-ae5b1d119a8a1d37d worktree-agent-aefcbe663a4008c9e worktree-agent-af7ed187ad26c88f8 worktree-agent-afcc050114bb5107e worktree-agent-afd662ed6e8c4d45e

## Work to complete
- Triage each branch: land (open a PR) or delete (`git push origin --delete <branch>`). Work in batches; record decisions in History.

## Acceptance
- `git branch -r --no-merged origin/main` is empty after `git fetch --prune`.

## History
- 2026-09-19 | OPEN | survey found 20 PR-less branches | full list above | triage pending
