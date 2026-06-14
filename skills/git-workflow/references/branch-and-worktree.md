# Branch and Worktree

## Boundaries

Branch is the review, history, and rollback boundary.

Worktree is the filesystem isolation boundary.

Use worktrees for isolation, not ceremony.

## Current workspace

Use the current workspace for fast local path changes: small, low-risk, easy-to-verify maintenance.

## Branch

Use a short-lived branch for normal GitHub Flow work:

- non-trivial code changes;
- skill behavior changes;
- multi-file changes;
- scripts, tests, schemas, registry, installation, or metadata changes;
- changes needing PR review, CI, or rollback boundary.

## Worktree

Use a worktree for:

- parallel streams;
- risky experiments;
- dirty workspace isolation;
- long PR iteration;
- simultaneous branch inspection.

Use harness-provided isolation when it already exists.

## Default branch

Default branch direct edits are limited to fast local path changes. Non-trivial work starts from a branch.

Existing uncommitted changes on the default branch are treated as user work. Preserve them.

## Branch names

Use:

```text
<type>/<short-topic>
```

Types:

```text
feat
fix
docs
refactor
test
chore
ci
build
perf
```

Examples:

```text
docs/skill-design
feat/git-workflow
refactor/superpowers-scope
fix/registry-validation
test/resource-metadata
```

Names stay lowercase, short, hyphenated, and descriptive. Include an issue number only when a real issue exists and helps review.

## Cleanup

Delete ordinary feature branches after merge. Clean worktrees after confirming their work is merged, saved, or intentionally discarded.
