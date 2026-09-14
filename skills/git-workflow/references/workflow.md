# Workflow

## Default

Use GitHub Flow with a fast local path.

Small, low-risk maintenance can stay in the current workspace. Non-trivial work uses a short-lived branch, pull request, CI/review as required, an appropriate merge strategy, and branch cleanup.

When the repository uses Issues for unresolved work, connect non-trivial implementation to its owning Issue rather than creating a parallel planning record.

## Fast local path

Use the current workspace when the change is:

- small;
- low-risk;
- easy to verify;
- local maintenance rather than a behavior, release, credential, deployment, or shared-contract change;
- not part of an existing non-trivial owning Issue/PR that should retain a review boundary.

Flow:

```text
inspect state -> edit -> relevant verification -> commit
```

## GitHub Flow path

Use branch and PR flow when the change:

- changes code behavior;
- changes skill activation or workflow rules;
- changes scripts, tests, schemas, installation, registry, or resource metadata;
- spans multiple concerns/files or has meaningful failure cost;
- benefits from CI/review or needs a rollback/discussion boundary.

When an owning Issue exists:

```text
Issue -> branch -> edit/focused checks -> PR -> CI/review -> authorized merge
      -> re-check Issue acceptance -> close or keep open
```

Without an owning Issue:

```text
branch -> edit/focused checks -> PR -> CI/review -> authorized merge
```

Do not create an Issue solely to satisfy the diagram when the PR fully owns a small concrete change and no unresolved lifecycle remains.

## Default branch

Keep the default branch installable and recoverable. Work in progress normally lives on branches/worktrees. Direct default-branch edits require repository/user authorization and should remain limited to cases where a review branch would add no useful boundary.