---
name: git-workflow
description: Use when working with Git or GitHub repository operations: checking state, choosing branch or worktree isolation, linking work to owning Issues, staging changes, writing Conventional-style commit messages, opening pull requests, handling CI/review feedback, merging, or cleaning up branches.
---

# Git Workflow

## Focus

Git and GitHub repository operations for personal development that stay compatible with GitHub Flow and, when the repository uses them, preserve Issue/PR ownership of unfinished work.

## Activation

Use this skill for repository state checks, branch/worktree decisions, Issue-to-branch/PR ownership, commit message writing, pull request preparation, CI feedback, review handling, merge, and branch cleanup.

## Default workflow

Use GitHub Flow with a fast local path.

Small, low-risk maintenance may use the current workspace with direct verification. Non-trivial work uses a short-lived branch, pull request, CI checks, review feedback, an appropriate merge strategy, and branch cleanup.

When the repository already uses Issues for unresolved work, identify the owning Issue before non-trivial implementation. A PR is the implementation/review surface for that problem; merging it does not automatically mean the Issue's acceptance criteria are complete.

## Rules

- Read actual Git/PR state before mutation; do not infer current state from old notes.
- Keep the default branch installable and recoverable.
- Use branches as review, history, and rollback boundaries.
- Use worktrees as filesystem isolation for parallel work, risky experiments, dirty workspaces, and long PR iteration.
- Keep one PR focused on one coherent change/problem.
- When an owning Issue exists, link the PR to it and preserve material acceptance/verification evidence there or in the PR.
- Do not close an unfinished Issue merely because a PR merged; close only when its acceptance criteria are satisfied.
- Use Conventional-style commit messages; write bodies for non-trivial changes.
- Open PRs for non-trivial changes.
- Use relevant focused local checks when useful; let repository CI own routine full acceptance when that is the repository policy.
- Merge only after required CI/review conditions are met and authorization permits the merge.
- Request independent review when its expected value justifies the cost; do not make a particular reviewer mandatory by ritual.
- Choose squash/merge/rebase according to repository policy and history value rather than treating one method as universal.
- Delete ordinary feature branches after merge when no stacked/dependent work still needs them.

## Support files

| Need | Load |
| --- | --- |
| Choosing fast local path or GitHub Flow path | `references/workflow.md` |
| Branch, worktree, default branch, and branch naming rules | `references/branch-and-worktree.md` |
| Conventional-style commit message rules | `references/commit-messages.md` |
| Owning Issue, PR, CI/review, merge, closure, and cleanup rules | `references/pull-requests.md` |
| OMP GitHub tool mapping for PRs, CI, searches, and PR checkout | `references/omp-github-tools.md` |
| Repository/project state checks before Git operations | `references/state-checks.md` |