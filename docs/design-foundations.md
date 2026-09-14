# Design foundations

omp-kit is an evidence-led harness for OMP. It starts from failures observed in real agent work, asks which layer actually owns the failure, and changes the smallest layer that makes the work reliably easier.

The project is not organized around a checklist of agent features. A feature should be able to answer:

1. What real problem or complaint caused it to exist?
2. Why is this mechanism preferable to simpler alternatives?
3. What evidence says it helps, and what evidence argues against it?
4. What result have we observed in omp-kit dogfood or experiments?
5. What change in models, OMP, or usage would make us revisit or delete it?

Detailed answers live in one design record per mechanism under `docs/design/`. This file stays short and summarizes the current project intuition.

## Project origin

A motivating example is OMP's Hashline edit interface. Coding-agent patch failures can look like model-intelligence failures even when much of the error comes from the model/tool contract: retyping old text, matching whitespace, acting on stale content, or targeting ambiguous locations. OMP's default Hashline mode instead anchors edits to tagged snapshots and rejects unsafe stale/unknown anchors. OMP also publishes first-party benchmark results showing large gains for some models, including Grok Code Fast 1 improving from 6.7% to 68.3% and Grok 4 Fast using 61% fewer output tokens on the same work.

That benchmark is not evidence that Hashline is universally best for every model. It is evidence for a broader intuition that matters to omp-kit:

> Before asking for a smarter model, ask whether the harness is making the model solve an unnecessarily hard mechanical problem.

References:

- OMP edit contract: https://github.com/can1357/oh-my-pi/blob/main/docs/tools/edit.md
- OMP first-party benchmark text (stable commit): https://github.com/can1357/oh-my-pi/blob/a3ee91a15330c00ee063210d110a917445d5e9b0/README.md

## Current principles

### Harness and interface quality are first-class

Effective agent performance depends on more than raw model intelligence. Tool contracts, context authority, runtime state, coordination, and verification can turn the same model into a more or less reliable system.

### Evidence-led, not feature-led

Prefer real complaints, source/runtime inspection, dogfood, tests, and controlled experiments over adding mechanisms because an agent architecture sounds plausible. Preserve counter-evidence and the limits of each claim.

### Model-compensation mechanisms are temporary until proven otherwise

Generic planning rituals, reflection loops, repetitive opinion-only review, and verbose handoffs may compensate for a particular model generation. Re-audit and ablate them as models improve instead of treating yesterday's workaround as permanent architecture. Issue #9 owns the later systematic current-generation audit; it is not complete merely because two opportunistic simplifications already landed.

### Runtime and evidence boundaries are more durable

State, ownership, permissions, cancellation, recovery, external facts, read-back, and objective acceptance cannot be removed merely by making the model reason better. Prefer OMP-native runtime primitives and external evidence over prompt conventions or local runtime clones.

### Capability design follows consequence, not labels

A prompt saying `do not write` is not a runtime security boundary. Authority-bearing capabilities should use runtime-enforced scoping when that boundary matters.

Not every write-shaped tool has the same consequence, however. `omp_kit_feedback` is intentionally a bounded shared evidence sink: Main/workers may append a structured observation, but the tool cannot mutate repository policy, Issues, configuration, or authorize another action. The earlier Main-only capability audit remains useful evidence for future OMP hardening; it is no longer a prerequisite for having feedback at all.

### Delegation is optional and must earn its coordination cost

Main-direct execution, one bounded worker, and parallel independent workers are all valid routes. Delegation is useful when parallelism, specialization, or context isolation outweigh specification, transfer, wait, integration, and repair costs. Optimize accepted useful work, not delegated-token ratio. See `design/delegation.md` and Issue #8.

### Multi-agent value comes from independent work and evidence

Multiple role personas reading the same assumptions do not automatically create independence. Parallel work is most defensible when writable scopes, evidence, or environments are genuinely independent and integration ownership remains explicit.

### Spend model judgment where deterministic automation cannot substitute

Cheap deterministic tests and repository verification should absorb mechanical uncertainty when they are fast. Strong review is more valuable for semantics, lifecycle, product judgment, ambiguity, and high-consequence risks. See `design/verification.md`.

### Observe normal work before designing experiments around impressions

OMP owns raw session/stat recording. omp-kit now derives compact routine session summaries and links structured feedback so #5/#8/#9 can reason from actual development rather than memory alone. Routine observations are not experiments by default; #12 owns promotion into durable experiment evidence when a sample materially supports a decision.

### Context quality is about authority, not only memory volume

Recovering information is different from knowing whether it is current, authoritative, observed, hypothetical, superseded, or permitted. Authority is claim-type specific: user intent, observable state, accepted policy, active work, rationale/evidence, and history use different source classes. Retrieved or external content never gains authorization merely by being available. See `design/context-authority.md`.

### Keep core policy model-neutral

Task shape and failure consequence should guide routing; concrete model/provider assignments remain runtime/user choices unless portable evidence justifies a stronger rule. Model capability and model economics change faster than the project principles above.

## Current design records

- [`design/harness-boundary.md`](design/harness-boundary.md) — what omp-kit should and should not own as models/runtime improve.
- [`design/delegation.md`](design/delegation.md) — why delegation is optional, bounded, and evidence-driven.
- [`design/verification.md`](design/verification.md) — why acceptance should add external evidence rather than repeated opinion.
- [`design/supervision.md`](design/supervision.md) — why waiting, progress, recovery, and result retrieval are runtime concerns.
- [`design/context-authority.md`](design/context-authority.md) — how intent, facts, policy, active work, evidence, history, permissions, and external context are reconciled without a second memory system.

The record format, evidence vocabulary, and coverage backlog are maintained in [`design/README.md`](design/README.md).