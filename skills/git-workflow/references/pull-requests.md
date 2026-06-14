# Pull Requests

## Purpose

Pull requests are the GitHub Flow collaboration record. Non-trivial work opens a PR after relevant local verification.

## PR body

Use this compact shape:

```markdown
## Summary
- ...

## Verification
- ...

## Notes
- ...
```

`Summary` explains what changed and why.

`Verification` lists commands, checks, CI status, or manual scenarios.

`Notes` records review focus, risks, intentionally unchanged areas, migration notes, or follow-up context when useful.

## PR size

One PR contains one coherent change. Code, docs, tests, and generated outputs can live together when they serve the same change. Unrelated cleanup, formatting, behavior changes, and design changes split into separate PRs.

## Copilot review

Request Copilot review for non-trivial PRs where a second pass can catch stale assumptions, scope drift, missing verification, or maintainability issues.

## CI

Run relevant local checks before opening or updating a PR. Merge after required CI passes.

CI failure flow:

1. Read the failed job logs.
2. Identify the failing command or check.
3. Fix the root cause.
4. Push an update.
5. Observe the CI result for the updated commit.

## Review feedback

Address review feedback on the same branch. Follow-up commits are fine during review. The final history is cleaned through the selected merge strategy.

## Merge

Squash merge is the default for pull requests. A merged PR becomes one curated Conventional commit on the default branch.

Use merge commit when the PR contains multiple clean logical commits whose individual history matters.

Use rebase merge when the PR commits are already clean, linear, and worth preserving individually.

Use fast-forward when the workflow is intentionally trunk-like and the branch is already linear.

## Squash commit

For non-trivial PRs, curate the squash commit before merge.

Subject:

```text
<type>(<scope>): <summary>
```

Body records durable history:

- why the change exists;
- what final decision, behavior, or boundary it creates;
- relevant impact or compatibility notes;
- verification evidence.

## Cleanup

Delete ordinary feature branches after merge. Keep maintenance branches while they serve an active version or release purpose. Clean worktrees only after confirming their work is merged, saved, or intentionally discarded.
