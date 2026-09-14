# Self-hosting feedback

Use this reference only when **real work has already exposed** reusable friction in
omp-kit or a material contradiction with observed OMP behavior. Do not invoke this
reference merely because a task is ending, and do not start extra exploration or a
reflection pass to search for something to report.

This is evidence-informed Main judgment, not a mechanical detector. The default after
an uneventful task is no feedback action.

## What belongs in feedback

Record a finding when it is both:

1. attributable to omp-kit policy, agents, skills, supervision, verification,
   integration behavior, or an upstream OMP capability/contract relevant to omp-kit;
2. plausibly reusable beyond the exact one-off repository circumstance.

Useful categories:

- `activation` — workflow entry or policy activation behaved poorly;
- `delegation` — routing, worker selection, briefing, ownership, waiting, or escalation;
- `context` — history, notes, context transfer, or authority boundaries;
- `supervision` — checkpointing, reuse, cancellation, coordination, or integration;
- `verification` — acceptance, review, or evidence policy created avoidable risk/cost;
- `capability` — omp-kit lacks a reusable capability needed by its intended workflow;
- `overhead` — omp-kit adds recurring cost or complexity without proportional value;
- `upstream` — observed OMP behavior/API materially conflicts with omp-kit assumptions.

Do not report ordinary project bugs, one-off repository quirks, transient provider
failures, personal preference, an isolated worker mistake, or unsupported speculation.
A worker being wrong once is not an omp-kit issue unless Main identifies a reusable
policy or tooling cause.

## Severity

Main estimates severity as engineering triage guidance:

- `low` — real and reusable, but limited impact or mostly optimization opportunity;
- `medium` — repeated occurrence would create meaningful cost, friction, or reliability
  loss;
- `high` — threatens correctness, safety, core workflow reliability, or regularly blocks
  successful completion.

Severity is an opinion for later review, not an automatic priority or change request.
Avoid false numerical precision.

## Evidence and suggested direction

Prefer the smallest concrete evidence that makes the finding reviewable: observed tool
behavior, command/output, path or API behavior, a concise workflow event sequence, or a
repeatable mismatch. Do not attach full transcripts or arbitrary large blobs.

`suggestedDirection` is Main's current hypothesis about a possible improvement. It is
not an accepted design, implementation instruction, or authorization to modify omp-kit.
Future omp-kit development must re-evaluate the finding against current code and OMP
behavior.

A useful report answers, concisely:

- what reusable problem Main observed;
- why Main believes it belongs to omp-kit or its upstream contract;
- how serious Main estimates it to be;
- what evidence supports that judgment;
- optionally, what direction appears worth investigating.

## Recording behavior

If `omp_kit_feedback` is available, submit one minimal finding. Prefer one report per
independent root problem rather than narrating the whole session. If the tool is not
available, report the limitation to the user only when it materially affects the task;
do not invent another persistence mechanism.

Do not add a second model turn, worker, scan, or tool call solely to manufacture a
self-improvement finding. Feedback is a by-product of observed work, not a mandatory
workflow phase.

The feedback sink must remain append-only reporting infrastructure. It must not decide
whether a report is correct, edit policy, modify configuration, create GitHub issues,
commit code, call a model, perform network telemetry, or trigger any other
self-modification.

Core invariant:

```text
report != self-modify
```
