# Pull Requests

## Purpose

Pull requests are the implementation, review, and CI record for a coherent change. When the repository uses Issues for unfinished work, a PR normally belongs to one concrete owning Issue/problem rather than replacing that Issue.

## Owning Issue

Before non-trivial implementation, identify the owning Issue when one already exists.

Use this split:

```text
Issue
  -> unresolved problem, scope, acceptance criteria, current unresolved decisions

PR
  -> implementation diff, review discussion, mechanical/runtime verification evidence
```

If no Issue exists and the task is already small, concrete, and fully represented by the PR, do not create one just for ceremony. Create/update an Issue when unresolved work needs an independent lifecycle beyond the PR.

A merged PR does not automatically close its Issue. Close the Issue only when its acceptance criteria are complete. If implementation lands but validation/dogfood/upstream conditions remain, keep the Issue open and mark its current attention state according to repository convention.

## PR body

Use a compact shape and include the owning Issue when relevant:

```markdown
## Summary
- ...

## Verification
- ...

## Related
- #<owning-issue>

## Notes
- ...
```

`Summary` explains what changed and why.

`Verification` lists commands, CI checks, released-runtime smokes, or manual scenarios appropriate to the claim.

`Related` links the owning Issue or directly related work without turning the PR into a roadmap.

`Notes` records review focus, risks, intentionally unchanged areas, migration notes, or follow-up context when useful.

## PR size

One PR contains one coherent change. Code, docs, tests, and generated outputs can live together when they serve the same change. Unrelated cleanup, formatting, behavior changes, and design changes split into separate PRs.

If implementation exposes a different independently closable problem, report it to the integration owner and create/update its own Issue when action is warranted; do not silently widen the PR.

## Review

Use independent review when it can catch stale assumptions, scope drift, missing verification, semantic/lifecycle risks, or maintainability problems worth the extra cost. Do not require a particular reviewer by ritual.

Address review feedback on the same branch. Follow-up commits are fine during review; preserve the history only when it has durable value.

## CI

Use repository policy for verification. Focused local checks are useful during implementation; when repository CI owns the routine full deterministic gate, do not duplicate that gate locally without a distinct reason.

CI failure flow:

1. Read the failed job logs.
2. Identify the failing command or check.
3. Fix the root cause.
4. Push an update.
5. Observe the CI result for the updated candidate.

## Merge

Merge only after required CI/review conditions are met and the user/repository authorization boundary permits it.

Choose the merge method by repository policy and history value:

- squash when the PR should become one curated logical commit;
- merge commit when multiple clean logical commits or stacked ancestry matter;
- rebase when commits are already clean, linear, and worth preserving individually.

For a curated commit, record the durable reason/boundary and material verification evidence; do not copy transient PR chatter.

## After merge

1. Confirm the landed default-branch state/CI when repository policy requires it.
2. Re-evaluate the owning Issue acceptance criteria.
3. Close the Issue only if all required criteria are complete; otherwise update its remaining condition/state.
4. Reconcile short project-state indexes if current priority/blockers changed.
5. Delete the ordinary feature branch only when no stacked/dependent work still needs it.

Clean worktrees only after confirming their work is merged, saved, or intentionally discarded.