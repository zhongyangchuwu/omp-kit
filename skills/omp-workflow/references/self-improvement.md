# Self-hosting feedback

Use this reference only when **real work has already exposed** reusable friction in
omp-kit or a material contradiction with observed OMP behavior. Do not invoke this
reference merely because a task is ending, and do not start extra exploration or a
reflection pass to search for something to report.

`omp_kit_feedback` is a shared evidence sink: Main and task agents may record a bounded
finding they directly observed. Recording a finding does not expand the reporting
agent's task scope and does not grant authority to edit the Harness, repository, policy,
or Issue state. Main/later project triage owns promotion decisions.

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
A worker being wrong once is not an omp-kit issue unless the reporting agent observed a
reusable policy/tooling cause.

## Severity

The reporting agent estimates severity as engineering triage guidance:

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

`suggestedDirection` is the reporting agent's current hypothesis about a possible
improvement. It is not an accepted design, implementation instruction, or authorization
to modify omp-kit. Future development must re-evaluate the finding against current code,
OMP behavior, session evidence, and user intent.

A useful report answers, concisely:

- what reusable problem was directly observed;
- why it appears to belong to omp-kit or its upstream contract;
- how serious the reporter estimates it to be;
- what evidence supports that judgment;
- optionally, what direction appears worth investigating.

## Recording behavior

If `omp_kit_feedback` is available, submit one minimal finding. Prefer one report per
independent root problem rather than narrating the whole session. If the tool is not
available, do not invent another persistence mechanism merely to preserve a routine
observation.

Do not add a second model turn, worker, scan, or tool call solely to manufacture a
self-improvement finding. Feedback is a by-product of observed work, not a mandatory
workflow phase.

The feedback sink is append-only reporting infrastructure. It may write its bounded
local evidence record and append the same record to OMP session provenance, but it must
not decide whether a report is correct, edit policy, modify configuration, create or
close GitHub Issues, commit code, call a model, upload telemetry, or trigger any other
self-modification.

Current released OMP does not expose first-class caller-agent identity in the public
extension context. Feedback therefore records supported session/file provenance and
must not guess whether the caller was Main or a particular worker. The session evidence
collector can later correlate that provenance with OMP trace tracks.

Core invariant:

```text
report != self-modify
feedback != authorization
```
