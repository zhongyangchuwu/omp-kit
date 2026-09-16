# State Checks

## Principle

Git workflows are stateful. Read repository state before branch, worktree, staging, commit, push, PR, merge, or cleanup operations. Re-read state after branch or worktree changes.

When the repository uses issue-centered coordination, recover only the ownership context relevant to the current task before non-trivial work: actual branch/HEAD first, then the owning Issue/PR when one exists. Do not require a repository-wide work-state index.

## State model

Check the relevant Git/GitHub state before acting:

- current branch and actual HEAD;
- default branch;
- detached HEAD state;
- dirty tracked files;
- untracked files;
- staged changes;
- upstream branch;
- ahead/behind state;
- PR state and required checks;
- worktree ownership;
- owning Issue/acceptance criteria when the repository uses Issues for unfinished work.

Do not copy an old commit SHA or PR status from notes and treat it as current observable state.

## Existing changes

Treat existing uncommitted changes as user work. Preserve them unless the user explicitly asks to modify or discard them.

When changes are present:

1. Identify whether they are related to the current task.
2. Keep unrelated changes out of commits and PRs.
3. Use a branch or worktree when isolation is needed.

## Detached HEAD

Detached HEAD is a state that needs an explicit safe target before non-trivial work. Create or switch to a branch when continuing work should be preserved.

## Default branch

Keep the default branch installable and recoverable. Non-trivial work normally starts from a branch unless repository/user policy explicitly authorizes a different path.

## Branch and worktree transitions

After creating, switching, or deleting a branch or worktree, re-check:

- current branch and HEAD;
- working tree cleanliness;
- expected path;
- upstream relationship when pushing is planned;
- whether the branch still matches the intended owning Issue/PR.

## Staging and commits

Stage only files that belong to the logical change. Review staged paths before committing. Commit generated outputs with their source change when they are direct consequences of that change.

## Merge and Issue completion

Before merge, confirm current PR head/base, required CI/review state, and authorization. After merge, inspect the landed state and re-evaluate the owning Issue acceptance criteria.

Do not equate `merged` with `Issue completed`. If runtime smoke, dogfood, migration, or another acceptance condition remains, keep the Issue open and record the remaining trigger/state.

## Cleanup

Before deleting a branch or worktree, confirm one of these is true:

- the work is merged and no stacked/dependent branch still needs it;
- the work is saved elsewhere;
- the user explicitly chose to discard it.

Worktree cleanup checks both Git state and filesystem ownership. Harness-owned workspaces stay under harness control.