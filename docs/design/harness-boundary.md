# Harness boundary

## Problem

Agent projects can accumulate layers that compensate for one model/runtime generation: forced planning, generic reflection, repeated reviewer passes, verbose handoffs, or context workarounds. Once the underlying capability improves, those layers can become pure overhead.

At the same time, some failures cannot be removed by model intelligence alone. A stronger model still cannot prove an external write happened after a lost response, recover a permission it was never granted, make an unsafe capability disappear, or reconstruct authoritative state without evidence.

omp-kit therefore needs a durable rule for deciding what belongs in the Harness, what belongs in OMP, and what should be left to the model.

## Evidence

### OMP Hashline: interface design changes effective model performance

**Type:** repository/runtime contract + first-party benchmark.

OMP's default Hashline edit mode anchors edits to tagged snapshots and rejects stale/unknown anchors instead of requiring the model to reproduce old text exactly. OMP publishes first-party benchmark text reporting large improvements for some models. This does not prove one edit protocol is universally optimal; it shows that apparent `model failures` can be interaction-contract failures.

References:

- https://github.com/can1357/oh-my-pi/blob/main/docs/tools/edit.md
- https://github.com/can1357/oh-my-pi/blob/a3ee91a15330c00ee063210d110a917445d5e9b0/README.md

### Strong-model Harness discussion

**Type:** external analysis / hypothesis.

External strong-model discussions argue that model-compensation scaffolding should be repeatedly ablated while runtime/evidence mechanisms remain durable. This is design input rather than benchmark truth.

References:

- https://www.iconb.cn/article/0eec42eaeef142c5df5c5e1f88864592
- https://www.makerjackie.com/blog/2026-09-07-gpt6-astra

### omp-kit dogfood

**Type:** repository fact + real development.

omp-kit already follows this boundary:

- native OMP task/hub/session behavior is reused instead of implementing a second orchestration runtime;
- core agents remain model-neutral instead of encoding one provider generation as architecture;
- delegation is optional rather than mandatory;
- generic end-of-task reflection was removed after review showed it added recurring obligation without a demonstrated need;
- duplicate unchanged full repository gates were removed while retaining one current integrated CI gate;
- a separate `.planning/` phase dossier workflow was removed after issue-centered state became the preferred model and no current consumer justified maintaining a second project-state system;
- OMP-native session/stats APIs replaced the obsolete local raw-session parser;
- a real OMP capability-isolation audit demonstrated that prompt-described read-only intent is not a hard runtime boundary;
- the feedback product was later deliberately narrowed in consequence rather than withheld: `omp_kit_feedback` is a shared evidence sink that cannot authorize or perform repository/policy/Issue mutation;
- routine session evidence now derives compact summaries from OMP public stats/trace surfaces rather than rebuilding raw telemetry ownership.

See `../architecture.md`, `../VALIDATION.md`, completed Issues #4/#13/#14/#18/#21, and open Issues #5/#8/#9/#11.

## Interpretation

The useful distinction is not `Harness vs no Harness`:

```text
model-compensation
  -> exists because the model cannot yet reliably do something
  -> should be ablated as model/runtime capability improves

runtime boundary
  -> owns state, permissions, cancellation, recovery, identity, external facts
  -> cannot be removed by asking the model to reason harder

evidence boundary
  -> tests, read-back, invariants, observed state
  -> should replace repeated opinion where possible
```

A strong model creates two opposite risks:

```text
model too weak     -> insufficient external structure -> missed obligations
model very strong  -> excessive external structure -> artificial steps/overhead
```

The target is the minimum external structure required for reliable real-world work.

## Design principle

> Change the smallest layer that actually owns the failure.

Before adding a workflow/agent mechanism:

1. identify the observed failure;
2. decide whether it is model, tool/interface, runtime, context/authority, workflow, or evidence;
3. prefer an existing OMP/public primitive if that layer already has an owner;
4. add omp-kit policy only when it is reusable and not already owned upstream;
5. define how the mechanism will be evaluated and when it can be removed.

Capability decisions also consider **consequence**. A write-shaped evidence append is not equivalent to repository mutation or policy authority. Hard runtime scoping remains necessary when the consequence requires a security boundary; it is not automatically required for every bounded reporting surface.

## Current ownership

```text
OMP owns:
  session/runtime semantics
  plugin discovery/install
  model selection mechanics
  task/subagent lifecycle
  generic stats/RPC/session handling
  raw session persistence and generic telemetry normalization

omp-kit owns:
  workflow policy
  task-shaped agents
  project-state conventions
  context/delegation/supervision policy
  Harness-specific assertions
  bounded structured feedback
  compact derived dogfood summaries
  optional integrations / genuinely new extensions
```

Reuse priority:

```text
OMP CLI/public behavior
-> OMP RPC / stats HTTP API
-> published OMP TypeScript APIs
-> small local fallback only for genuinely omp-kit-owned semantics
```

The project deliberately avoids a second SessionManager, scheduler, task executor, worker-result store, raw-session parser, trace database, pricing layer, profile/runtime clone, or parallel project-state system.

## Current-generation scaffolding inventory

Issue #9 owns the future **systematic** audit. The rows below record current known mechanisms and three opportunistic accepted ablations; they do not mean #9 has been completed.

| Mechanism | Classification | Current decision |
| --- | --- | --- |
| Mandatory planner/architect/reviewer chain | model-compensation | absent; keep absent |
| Delegation for every task | model-compensation | absent; Main-direct remains valid |
| Independent strong review after every edit | model-compensation | absent; review remains consequence/ambiguity-driven |
| Generic end-of-task self-improvement reflection | model-compensation | removed; feedback is triggered by friction already observed |
| Full repository verification in every worker plus again after integration | repeated evidence/process overhead | removed as default; focused checks + current PR merge-ref gate |
| Rewriting long parent context into every worker brief | context overhead | avoid; push bounded execution contract and retrieve rationale on demand |
| Search-first history retrieval as a hard gate | model-compensation | not a hard gate; retrieve when relevant |
| Issue-centered project state | state/context boundary | keep as the multi-session coordination model; continue dogfood under #11 |
| Durable `.planning/` lifecycle | workflow scaffolding | removed; no current consumer justified a second phase/state dossier, and Git history retains the retired implementation |
| Integrated deterministic repository verification | evidence boundary | keep; GitHub Actions runs repository-owned gate on PR merge-ref + landed main |
| Runtime capability enforcement | runtime boundary | keep OMP-owned; never fake security with prompt conventions |
| Structured feedback | evidence boundary | keep bounded/shared; `feedback != authorization` |
| OMP-native raw session/stats recording | runtime/evidence boundary | keep OMP-owned |
| omp-kit compact session summaries | project evidence semantics | keep as derived local layer; do not copy raw transcript/trace ownership |

## Accepted opportunistic ablations

### Generic end-of-task reflection

Current default:

```text
reusable friction observed during real work
-> record the smallest evidence-backed finding when useful

no observed friction
-> no feedback/reflection phase
```

This removes a recurring model-compensation obligation without weakening the durable evidence sink.

### Duplicate repository-wide verification

Current default:

```text
implementation/debugging
-> focused checks relevant to the change

settled candidate
-> one deterministic PR merge-ref gate
-> post-landing main gate for the distinct landed-tree question
```

A local/worker full gate remains available for a distinct purpose: isolated pre-merge safety, cross-slice diagnosis, explicit request, CI diagnosis, or a genuinely local/runtime claim.

### Specialized `.planning/` dossier

Current default:

```text
accepted behavior / rationale
-> current docs and design records

unfinished concrete work
-> task-local Issue when useful

implementation / review / CI
-> PR + Actions

chronology
-> Git + Issue/PR history
```

The former `.planning/` tree duplicated root state, phase lifecycle, handoffs and release records beside these owners. The workflow remains recoverable from Git history, but omp-kit no longer maintains it without a concrete consumer. A future offline or formal-dossier need should be designed from that real use case rather than preserving a generic phase system speculatively.

## Evaluation / observed effect

Current real-work evidence includes:

- the project moved toward OMP-native plugin/resources instead of expanding a custom runtime;
- the capability audit exposed a real distinction between role intent and runtime enforcement;
- shared feedback runtime acceptance on OMP 18.1.21 showed bounded Main/worker reporting can ship without treating it as policy authority;
- the obsolete local raw-session parser was removed after OMP-native observability proved sufficient;
- the v0 session-evidence collector now supplies routine model/tool/delegation/timing observations for future #5/#8/#9 decisions;
- deterministic repository acceptance moved to GitHub Actions while released-runtime claims remain separate;
- issue-centered task ownership replaced both the global work-state mirror and the separate `.planning/` dossier, reducing duplicated current-state owners.

The next phase is measured dogfood, not more speculative architecture. #5/#8/#11 should produce natural evidence; #9 reactivates when enough evidence exists for systematic subtraction.

## Counter-evidence and limits

- Stronger models can skip obligations they consider obvious; some external structure remains useful when it enforces state/evidence rather than weak-model reasoning rituals.
- A mechanism that looks like model compensation may encode organizational or safety semantics. Remove the recurring obligation, not the underlying evidence boundary, unless evidence supports that stronger change.
- Shared feedback is safe only because its consequences are deliberately bounded. This conclusion must not be generalized to arbitrary worker write/mutation capabilities.
- OMP 18.1.21 still lacks some desired per-agent capability/read-only contracts; future upstream hardening may justify narrower surfaces.
- The session-evidence v1 provider field is sampled, not an exact per-request routing ledger.
- CI cannot replace an installed-runtime/profile smoke when the claim depends on local OMP state.
- External strong-model discussion remains design input rather than benchmark truth.
- Issue-centered coordination depends on remote Issue availability for unresolved remote-only details; accepted truth and rationale must therefore remain in the checkout rather than being left only in GitHub discussion.

## Current status

**Accepted boundary principle; three opportunistic ablations accepted; systematic #9 audit not yet performed.**

Issue #9 remains inactive until routine session evidence is sufficient to inventory and evaluate current model-compensation scaffolding, or until repeated friction makes a specific rule decision-relevant.

## Related implementation / Issues

- `../architecture.md`
- `../workflows.md`
- `../VALIDATION.md`
- `verification.md`
- `../../.github/workflows/verify.yml`
- `../../skills/omp-workflow/SKILL.md`
- `../../skills/omp-workflow/references/execution.md`
- `../../skills/omp-workflow/references/self-improvement.md`
- completed Issue #4 — shared feedback acceptance and historical capability-boundary evidence
- Issue #5 — natural worker-tool observations
- Issue #8 — delegation economics
- Issue #9 — systematic model-compensation/process ablation
- completed Issue #10 — context authority/provenance design
- Issue #11 — issue-centered project-state/recovery dogfood
- completed Issue #21 — routine session evidence product

## Revisit triggers

Re-audit this record when:

- a major model generation materially changes planning, tool use, context recovery, or instruction following;
- OMP introduces a native capability that duplicates omp-kit policy/runtime logic;
- dogfood shows a rule adds latency/tokens/handoffs without new evidence;
- repeated failures show the current Harness under-constrains a mechanical or external-state obligation;
- event-triggered feedback misses reusable friction that the previous default reflection reliably surfaced;
- focused checks repeatedly miss failures an earlier broad gate would materially catch;
- stronger OMP capability scoping changes the consequence/benefit tradeoff for worker tools;
- routine session evidence proves insufficient for #5/#8/#9 decisions.
