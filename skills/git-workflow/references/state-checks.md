# State Checks

## Principle

Git workflows are stateful. Read repository state before branch, worktree, staging, commit, push, PR, merge, or cleanup operations. Re-read state after branch or worktree changes.

## State model

Check the relevant state before acting:

- current branch;
- default branch;
- detached HEAD state;
- dirty tracked files;
- untracked files;
- staged changes;
- upstream branch;
- ahead/behind state;
- PR state;
- worktree ownership.

## Existing changes

Treat existing uncommitted changes as user work. Preserve them unless the user explicitly asks to modify or discard them.

When changes are present:

1. Identify whether they are related to the current task.
2. Keep unrelated changes out of commits and PRs.
3. Use a branch or worktree when isolation is needed.

## Detached HEAD

Detached HEAD is a state that needs an explicit safe target before non-trivial work. Create or switch to a branch when continuing work should be preserved.

## Default branch

Default branch direct edits fit the fast local path only. Non-trivial work starts from a branch.

## Branch and worktree transitions

After creating, switching, or deleting a branch or worktree, re-check:

- current branch;
- working tree cleanliness;
- expected path;
- upstream relationship when pushing is planned.

## Staging and commits

Stage only files that belong to the logical change. Review staged paths before committing. Commit generated outputs with their source change when they are direct consequences of that change.

## Cleanup

Before deleting a branch or worktree, confirm one of these is true:

- the work is merged;
- the work is saved elsewhere;
- the user explicitly chose to discard it.

Worktree cleanup checks both Git state and filesystem ownership. Harness-owned workspaces stay under harness control.
