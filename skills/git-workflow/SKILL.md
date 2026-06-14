---
name: git-workflow
description: Use when working with Git or GitHub repository operations: checking state, choosing branch or worktree isolation, staging changes, writing Conventional-style commit messages, opening pull requests, handling CI feedback, using Copilot review, squash merging, or cleaning up branches.
---

# Git Workflow

## Focus

Git and GitHub repository operation workflow for personal development that stays compatible with GitHub Flow.

## Activation

Use this skill for repository state checks, branch/worktree decisions, commit message writing, pull request preparation, CI feedback, review handling, squash merge, and branch cleanup.

## Default workflow

GitHub Flow with fast local path.

Small, low-risk maintenance may use the current workspace with direct verification. Non-trivial work uses a short-lived branch, pull request, CI checks, review feedback, squash merge, and branch deletion.

## Rules

- Keep the default branch installable and recoverable.
- Use branches as review, history, and rollback boundaries.
- Use worktrees as filesystem isolation for parallel work, risky experiments, dirty workspaces, and long PR iteration.
- Use Conventional-style commit messages.
- Write commit bodies for non-trivial changes.
- Open PRs for non-trivial changes.
- Run relevant local verification before PR.
- Merge after required CI passes.
- Request Copilot review for non-trivial PRs where a second pass can catch stale assumptions, scope drift, or missing verification.
- Squash merge by default and curate the squash commit message.
- Delete ordinary feature branches after merge.

## Support files

| Need | Load |
| --- | --- |
| Choosing fast local path or GitHub Flow path | `references/workflow.md` |
| Branch, worktree, default branch, and branch naming rules | `references/branch-and-worktree.md` |
| Conventional-style commit message rules | `references/commit-messages.md` |
| Pull request, CI, Copilot review, squash merge, and cleanup rules | `references/pull-requests.md` |
| Repository state checks before Git operations | `references/state-checks.md` |
