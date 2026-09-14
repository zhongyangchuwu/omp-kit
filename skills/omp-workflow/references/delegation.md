# Delegation

Main owns user intent, task boundaries, shared interfaces, acceptance, escalation and integration. Workers own only the bounded work assigned to them. Optimize accepted useful work, not delegation rate or worker token share.

## Choose delegation only when it earns its cost

Use Main direct for small, high-context or judgment-heavy work. Delegate when specialization, isolation or parallelism is likely to outweigh briefing, transfer, waiting, integration and repair cost.

Choose a discovered agent by task shape:

- `luna-code` — clear local/pattern-based implementation;
- `luna-deep` — difficult cross-file implementation/debugging;
- `luna-doc` — documentation/config synthesis;
- `sol-review` — independent intent-level review when a second judgment is valuable.

Concrete model/effort selection belongs to OMP/user runtime configuration, not to the agent definition.

## Dispatch contract

Give a worker only what controls execution:

```text
objective
allowed/writable scope
material constraints
context references
acceptance / verification target
```

Do not rewrite long parent history the worker can retrieve. One owner should control each writable scope; overlapping concurrent writes require isolation or serialization.

If a worker finds an out-of-scope consumer or dependency, it reports it to Main rather than silently widening scope.

## Coordination

Use OMP's supported task/hub/result-delivery surfaces and inspect the live schema rather than guessing commands. Preserve the returned worker id and reuse the same worker for coherent follow-up when supported.

A wait timeout or missing result is not proof of failure. Inspect supported status once, request a concise checkpoint when useful, and continue only when there is new evidence or a justified next step. Avoid short polling loops and repeated supervisor wakeups.

Cancel or replace a worker when continued execution has no justified path, after preserving useful partial evidence. Do not scrape live session files merely to infer whether another agent is busy.

## Repair and escalation

Follow the worker's `bounded-executor` repair contract. Repeated materially different failures on the same blocker trigger a report/escalation rather than an unbounded autonomous loop. Main may clarify scope, split the task, choose another route, or return a material product/authorization decision to the user.

## Integration and verification

Workers use focused checks that can falsify their own change. A repository-wide full gate is not mandatory in every worker.

Main reconciles actual writes and shared contracts, then relies on the current PR merge-ref CI for routine integrated mechanical acceptance when the repository provides it. If the accepted tree changes, the new CI result is evidence for the new candidate.

Independent review is selected by failure cost, ambiguity and the value of another judgment. Prefer giving a reviewer a mechanically clean integrated diff so reviewer effort goes to semantics, lifecycle, product behavior and other questions deterministic checks do not decide.
