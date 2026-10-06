# Delegation and persistent workers

Main owns user intent, task boundaries, shared interfaces, acceptance, escalation and integration decisions. Workers own scoped exploration and implementation. Optimize useful accepted work, not time spent waiting or a fixed token-share target.

## Select by task, not by a mandatory escalation ladder

Use `luna-code` for clear local/pattern-based changes, `luna-deep` for difficult
cross-file work, `luna-doc` for documentation/config synthesis and `sol-review`
for an independent high-risk review. Resolve these from the live agent catalog;
never assume an unavailable agent or tool exists.

Agent definitions use native model-role aliases, keeping provider-specific IDs out of prompts. Choose a task-specific model selector when the work warrants it; use native presets and selectors rather than adding a model-routing layer here.

Give each workstream an immediate objective, allowed scope, context references and completion evidence. Do not restate long discussions the worker can retrieve. State important invariants and acceptance criteria explicitly. Use one owner per writable scope; concurrent independent work is useful, while overlapping edits need isolation or a serialized integration plan.

If a workstream changes a shared interface or contract, Main owns the consumer/integration question. Account for likely production callers, tests/fixtures, mocks/fakes and contract-facing docs/examples. Workers report out-of-scope consumers; Main decides whether to reassign them. At integration, reconcile actual changed files with assigned scopes.

## Lifecycle and supervision

Use OMP's native task lifecycle: use `speculativeLaunch` when appropriate and follow live descriptions for task progress, `completionProbe` and owned-job `wait`. Prefer useful parallel work over waiting. Do not reproduce runtime polling, adaptive-delay, or manual timing/checkpoint schedules in omp-kit guidance. Main decides whether observed progress, errors or a blocker warrant intervention; use native task controls only when action is material. Preserve task scope and evidence if work must be reassigned.

If built-in Vibe is used instead, load `vibe-compat.md`; its lifecycle is distinct from native task supervision.

## Escalation

Follow the worker's bounded repair/stop contract. Repeated materially different failures on one unresolved blocker require a report and Main's judgment, not an unbounded retry or agent loop. Return material product preferences, irreversible architecture choices and destructive operations to the user; ordinary implementation choices may follow repository conventions.
