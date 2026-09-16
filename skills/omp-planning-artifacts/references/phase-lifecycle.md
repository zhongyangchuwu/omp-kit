# Specialized Phase Lifecycle

Use this lifecycle only after a project deliberately selects the `omp-planning-artifacts` `.planning/` workflow. Ordinary multi-session work should use task-local repository/Issue/PR state instead.

## Core progression

A phase is one coherent deliverable with explicit success criteria. Its core progression is:

```text
not-started -> discussing/planning -> executing -> verifying -> complete
```

`state.md` owns the detailed `STATE.md` status vocabulary, including optional research, review, capture, blocked, and ready states. Do not maintain a second exhaustive status list here.

| Stage | Purpose | Typical artifact | Exit condition |
| --- | --- | --- | --- |
| `not-started` | phase exists but work has not begun | none | phase is selected |
| `discussing` | resolve product/approach ambiguity | `CONTEXT.md` | material decisions are sufficient |
| `planning` | make execution/acceptance concrete | `PLAN.md` (+ optional research) | plan covers phase success criteria |
| `executing` | implement the phase | changed source + concise summary | implementation is integrated |
| `verifying` | prove observable success | `VERIFICATION.md` | phase criteria have evidence |
| `complete` | advance durable state | optional `CAPTURE.md` | roadmap/state are reconciled |

Do not create every artifact by ritual. `phase-artifacts.md` defines the available artifact contracts; create only the subset a later phase, maintainer, or agent will actually consume.

## Discussing and planning

Capture decisions that constrain implementation: intended outcome, material constraints, chosen approach when alternatives matter, verification expectations, and unresolved questions.

Write an executable plan only when the work benefits from one. Tie acceptance to mapped requirements and observable phase success criteria. Research is optional and should answer a concrete question rather than exist because the lifecycle has a research slot.

For a brownfield dossier, load `codebase-exploration.md` only when a reusable map is cheaper than repeated direct repository inspection.

## Executing

Implement within the accepted phase scope. Use ordinary `omp-workflow` routing, delegation, integration, and verification policy; `.planning/` does not create a second scheduler or worker hierarchy.

Record a plan deviation only when it changes what later verification or phases need to know.

## Verifying

Verify the actual integrated state against the phase's success criteria. Mechanical repository CI can provide deterministic evidence, while runtime/environment-specific claims still need their relevant smoke or read-back.

A phase is not complete merely because an implementation PR merged.

## Completing and advancing

When a phase is complete:

1. reconcile the phase status and progress in `ROADMAP.md`;
2. update requirement traceability only for criteria actually satisfied;
3. update `PROJECT.md` only when accepted product scope, constraints, or durable decisions changed;
4. advance compact `STATE.md` to the next real focus;
5. retain `CAPTURE.md` only when it preserves useful workflow knowledge not already owned by current project docs.

`root-artifacts.md` owns the cross-file synchronization invariants. Do not duplicate Issue/PR chronology into `.planning/` when Git already owns it.

## Dependencies, pause, and resume

Start dependent work only after the required predecessor outcome actually exists, not merely because a checkbox was toggled. Insert an intermediate phase only for a real deliverable; do not turn phase numbering into a generic backlog.

Prefer compact root `STATE.md` plus the current phase artifacts. Add a phase-local `HANDOFF.md` only when work stops in a state that cannot be recovered cheaply from repository state and existing artifacts.

On resume:

1. inspect actual branch/HEAD and worktree;
2. read `STATE.md`;
3. load the minimum current phase artifacts needed;
4. re-check any observable facts that may have gone stale.

## Release/archive

Completed phase artifacts may remain in place until a real published release/archive need appears. `release-artifacts.md` owns the archive shape and `root-artifacts.md` owns the root-document update flow. Do not archive merely to make the active tree look tidy.