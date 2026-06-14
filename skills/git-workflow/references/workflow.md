# Workflow

## Default

Use GitHub Flow with fast local path.

Small, low-risk maintenance can stay in the current workspace. Non-trivial work uses a short-lived branch, pull request, CI checks, review feedback, squash merge, and branch deletion.

## Fast local path

Use the current workspace when the change is:

- small;
- low-risk;
- easy to verify locally;
- local maintenance rather than a behavior, release, credential, deployment, or shared-contract change.

Flow:

```text
current workspace -> edit -> relevant verification -> commit
```

## GitHub Flow path

Use branch and PR flow when the change:

- changes code behavior;
- changes skill activation or workflow rules;
- changes scripts, tests, schemas, installation, registry, or resource metadata;
- spans multiple concerns or files;
- benefits from CI, Copilot review, or human review;
- needs a clear rollback or discussion boundary.

Flow:

```text
branch -> edit -> local verification -> push -> PR -> CI/review -> squash merge -> delete branch
```

## Default branch

Keep the default branch installable and recoverable. Work in progress lives on branches or worktrees. Direct default-branch edits fit the fast local path only.
