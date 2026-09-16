# Specialized Phase Lifecycle

Use this lifecycle only after `.planning/` mode was chosen explicitly under `initialization.md`. Ordinary multi-session work should use the issue-centered project state in `project-state.md` instead.

## Phase model

A phase is one coherent deliverable with explicit success criteria.

```text
not-started -> discussing -> planning -> executing -> verifying -> complete
```

| State | Purpose | Typical artifact | Exit condition |
| --- | --- | --- | --- |
| `not-started` | phase exists but work has not begun | none | phase is selected |
| `discussing` | resolve product/approach ambiguity | `CONTEXT.md` | material decisions are sufficient |
| `planning` | make execution/acceptance concrete | `PLAN.md` (+ optional research) | plan covers phase success criteria |
| `executing` | implement the phase | changed source + concise summary | implementation is integrated |
| `verifying` | prove observable success | `VERIFICATION.md` | phase criteria have evidence |
| `complete` | advance durable state | optional `CAPTURE.md` | roadmap/state are reconciled |

Do not create every artifact by ritual. A simple phase may need only a plan and verification record; create context/research/capture files only when they preserve information that would otherwise be lost.

## Discussing

Capture decisions that constrain implementation:

- intended outcome;
- material constraints;
- chosen approach when alternatives matter;
- known risks/open questions.

Do not use discussion artifacts as a second requirements backlog.

## Planning

Write an executable plan only when the implementation is complex enough to benefit from one. Tie plan acceptance to the phase's requirements and observable success criteria.

Optional research belongs here when external evidence is needed before implementation. Do not research by default.

## Executing

Implement within the accepted phase scope. Use ordinary omp-workflow delegation/integration rules; the `.planning/` lifecycle does not create a second scheduler or worker hierarchy.

Record material deviations from the plan when they change what later verification or phases need to know.

## Verifying

Verify the actual integrated state against phase success criteria. Mechanical repository CI can provide deterministic evidence, while runtime/environment-specific claims still need their relevant smoke/read-back.

A phase is not complete merely because its implementation PR merged.

## Completing and advancing

When a phase is complete:

1. mark the phase complete in `ROADMAP.md`;
2. update requirement traceability for criteria actually satisfied;
3. reconcile `PROJECT.md` only when accepted scope/product meaning changed;
4. advance compact `STATE.md` to the next real focus;
5. retain a `CAPTURE.md` only when durable project knowledge is not already owned by current docs/design records.

Do not duplicate Issue/PR chronology into `.planning/` when GitHub already owns it.

## Dependencies and insertion

A phase may depend on earlier phases. Start dependent work only after the dependency's required outcome exists, not merely because a checkbox was toggled.

Use decimal phases only for genuine inserted deliverables that must occur before a later planned phase. Do not turn decimal phases into a generic issue tracker.

## Pause and resume

Prefer the compact root `STATE.md` plus the current phase artifacts. Add a phase-local handoff only when work stops in a state that cannot be recovered cheaply from repository state and existing artifacts.

On resume:

1. inspect actual branch/HEAD and worktree;
2. read `STATE.md`;
3. read the current phase's minimum relevant artifacts;
4. verify any stale observable facts before continuing.

## Archive

Completed phase artifacts may remain in place until a real release/archive need appears. Archive deliberately; do not move files merely to keep the tree aesthetically clean.