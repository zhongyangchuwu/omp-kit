# Harness boundary

## Problem

Agent projects can accumulate layers that look architectural but actually compensate for a weakness of one model generation: forced planning, generic reflection, repeated reviewer passes, verbose handoffs, or context workarounds. Once the underlying model/runtime improves, those layers can become pure overhead or even destroy useful information through extra handoffs.

At the same time, some failures cannot be removed by model intelligence alone. A smarter model still cannot infer whether an external write succeeded after a lost response, recover permissions it was never granted, make an unsafe tool disappear, or prove a state transition without external evidence.

omp-kit therefore needs a durable rule for deciding what belongs in the harness and what should be left to the model or OMP runtime.

## Evidence

### OMP Hashline: interface design can change effective model performance

**Type:** repository/runtime contract + first-party benchmark.

OMP's default Hashline edit mode anchors edits to tagged snapshots and validates stale/unknown anchors instead of requiring the model to reproduce old text exactly. OMP publishes first-party benchmark text reporting Grok Code Fast 1 moving from 6.7% to 68.3% and Grok 4 Fast using 61% fewer output tokens on the same work.

This does not establish that one edit protocol is optimal for every model. It establishes the more general point that some apparent `model failures` are interaction/interface failures and can change sharply when the harness contract changes.

References:

- https://github.com/can1357/oh-my-pi/blob/main/docs/tools/edit.md
- https://github.com/can1357/oh-my-pi/blob/a3ee91a15330c00ee063210d110a917445d5e9b0/README.md

### Strong-model Harness discussion

**Type:** external analysis / hypothesis.

`GPT-6 Astra 之后，哪些 Harness 还值得做？` argues that model-compensation scaffolding should be repeatedly ablated while runtime/evidence mechanisms remain durable. Its central distinction is between things model scaling can plausibly absorb (generic reasoning/planning/self-correction rituals) and things that depend on external state (permissions, idempotency, cancellation, recovery, read-back, objective acceptance).

Reference: https://www.iconb.cn/article/0eec42eaeef142c5df5c5e1f88864592

### Real-user reports of over-harnessing

**Type:** community report / anecdote.

Maker Jackie's Astra usage notes report moving toward a simpler plan -> implementation -> acceptance workflow and recommend re-auditing old `AGENTS.md` / Skills after model upgrades. This is useful field evidence, not a controlled benchmark.

Reference: https://www.makerjackie.com/blog/2026-09-07-gpt6-astra

### omp-kit architecture choices

**Type:** repository fact + dogfood.

omp-kit already follows this boundary in several places:

- native OMP task/hub/session behavior is reused instead of implementing a second orchestration runtime;
- core agents remain model-neutral instead of encoding one provider generation as architecture;
- delegation is optional rather than mandatory;
- the Phase 1.5 feedback capability leak is treated as an OMP runtime blocker rather than patched with prompt-only `do not write` conventions;
- deterministic validation is separated from live runtime/provider evidence.

See `../architecture.md`, `../VALIDATION.md`, and Issues #4/#9.

## Interpretation

The useful distinction is not `Harness vs no Harness`. It is:

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
model too weak  -> insufficient external structure -> missed steps
model very strong -> excessive external structure -> artificial steps and overhead
```

The target is not maximum process. It is the minimum external structure required for reliable real-world work.

## Design principle

> Change the smallest layer that actually owns the failure.

Before adding a workflow/agent mechanism:

1. identify the observed failure;
2. decide whether it is model, tool/interface, runtime, context/authority, workflow, or evidence;
3. prefer an existing OMP/public primitive if that layer already has an owner;
4. add omp-kit policy only when it is reusable and not already owned upstream;
5. define how the mechanism will be evaluated and when it can be removed.

## Current mechanism

omp-kit currently uses this ownership split:

```text
OMP owns:
  session/runtime semantics
  plugin discovery/install
  model selection mechanics
  task/subagent lifecycle
  generic stats/RPC/session handling

omp-kit owns:
  workflow policy
  task-shaped agents
  context/delegation/supervision policy
  Harness assertions
  optional integrations
  genuinely new OMP extensions
```

Reuse priority:

```text
OMP CLI/public behavior
-> OMP RPC / stats HTTP API
-> published OMP TypeScript APIs
-> small local fallback only for genuinely omp-kit-owned semantics
```

The project deliberately avoids a second SessionManager, scheduler, task executor, result store, session parser, telemetry database, or profile/runtime clone.

## Current-generation scaffolding inventory

Issue #9 periodically audits rules that can consume model attention, handoffs, extra turns, or repeated tool work. The current inventory distinguishes default policy from deliberately opt-in workflow modes.

| Mechanism | Current classification | Current decision |
| --- | --- | --- |
| Mandatory planner/architect/reviewer chain | model-compensation | absent; keep absent |
| Delegation for every task | model-compensation | absent; Main-direct remains valid |
| Independent strong review after every edit | model-compensation | absent; review remains conditional on risk/ambiguity |
| Generic end-of-task self-improvement reflection | model-compensation | removed; feedback is event-triggered by friction already observed during real work |
| Repository-wide full verification in every worker plus again after integration | repeated evidence/process overhead | removed as default; focused worker checks + one integrated gate, with worker full gate only for a distinct purpose |
| Rewriting long parent context into every worker brief | model-compensation / context overhead | avoid; push the execution contract and retrieve rationale/history on demand |
| Search-first history retrieval as a hard gate | model-compensation | not a hard gate; it is relevance guidance and broader concise reads remain valid when appropriate |
| Durable `.planning/` phase lifecycle | specialized persistence/workflow mode | retain as deliberate opt-in pending Issue #11; missing `.planning/` is not a reason to initialize it |
| Integrated deterministic repository verification | evidence boundary | keep; GitHub Actions executes the repository-owned gate once on the accepted CI-supported tree |
| Runtime capability enforcement | runtime boundary | keep OMP-owned; never replace with prompt conventions |
| OMP-native session/stats telemetry | runtime/evidence boundary | keep and reuse; do not rebuild a parser/database/collector |

This inventory intentionally does not delete every old reference file. A mechanism can be useful as an explicit specialized mode without belonging in the default workflow. Issue #11 owns the broader `.planning/` coexistence/replacement decision.

### Ablation 1: generic end-of-task reflection

The default `omp-workflow` previously told Main to check for omp-kit friction before every repository task completed. That rule did not require an extra model call, but it imposed a generic reflection obligation even when no relevant friction had appeared.

The default is now event-triggered:

```text
friction observed during real work
-> load self-improvement guidance
-> record the smallest evidence-backed finding when useful

no observed friction
-> no feedback/reflection phase
```

This removes a recurring model-compensation obligation without weakening the durable feedback sink or the `report != self-modify` boundary. It was accepted through the normal provider-free repository gate.

### Ablation 2: duplicate repository-wide verification

The earlier verification workflow encouraged a worker to run the entire cheap deterministic suite before handoff and then required another full pass on the integrated tree. The second pass is necessary when the tree changes; the first is not automatically useful merely because CPU execution is cheap. It still costs orchestration/tool turns, produces repeated output, and can describe a transient shared tree.

Current default:

```text
worker implementation/debugging
-> focused checks that answer the worker's change

related writes settle
-> one full deterministic gate on the accepted integrated tree
```

A worker full gate remains available for a distinct question: isolated pre-merge safety, cross-slice diagnosis, explicit Main request, CI diagnosis, or an isolated worker-owned final tree whose result can be reused as acceptance evidence.

This preserves the evidence boundary while removing duplicate collection of the same evidence. The split-core sequence supplied real dogfood: unchanged handoffs did not justify repeated full runs, while later tree changes correctly made earlier evidence stale. Issue #18 then moved the routine integrated gate to GitHub Actions so repository mechanical acceptance no longer requires a local-agent handoff.

## Evaluation / observed effect

The strongest current evidence is architectural and real-work based rather than a requirement for a controlled A/B on every policy edit:

- Phase 1 moved the project toward native OMP plugin/resources instead of expanding the legacy custom Harness runtime.
- Phase 1.5 exposed a real capability-boundary problem. The project stopped at the upstream boundary instead of disguising it with a local heuristic.
- The current workflow has only three routing shapes (Main direct, one bounded worker, parallel independent workers) rather than a mandatory planner/architect/reviewer chain.
- The obsolete local OMP session parser was removed after OMP-native telemetry proved sufficient for the exercised use case.
- Generic end-of-task self-improvement reflection is no longer mandatory; feedback is a by-product of observed friction rather than a workflow phase.
- Repository-wide deterministic verification remains an acceptance boundary, but repeated equivalent full-gate runs are no longer a default worker ritual.
- GitHub Actions now executes the settled-tree deterministic gate automatically; local execution is reserved for focused debugging or genuinely local/runtime-specific claims.

Recurring dogfood should reveal whether these simplifications preserve useful findings while reducing workflow/tool overhead. #5/#8 telemetry can supply natural evidence without a separate synthetic experiment.

## Counter-evidence and limits

- Stronger models can become more likely to skip steps they consider obvious. Some harness constraints remain useful when they enforce obligations or external evidence rather than compensate for weak reasoning.
- A mechanism that looks like model compensation may also encode valuable organizational or safety semantics. Remove the recurring obligation, not the underlying evidence boundary, unless evidence supports that stronger change.
- Removing generic reflection could reduce the rate at which weak but recurring friction is noticed. Revisit if real dogfood stops surfacing issues that were previously caught reliably.
- A worker full gate can still be the cheapest useful evidence before a risky isolated merge or while diagnosing a broad breakage. The policy removes automatic duplication, not the ability to run it.
- Reducing test repetition must not become permission to ignore a failed or missing final integrated gate merely to save tokens/time.
- CI cannot replace an installed-runtime/profile smoke when the claim actually depends on local OMP state.
- External strong-model discussion is design input, not benchmark truth.

## Current status

**Accepted project principle; current-generation inventory established; recurring evaluation remains open.**

Ablations 1 and 2 are accepted. Issue #18 completed routine CI execution of the integrated deterministic gate. Issue #9 remains open as a recurring audit for future model/runtime changes rather than because either current ablation is awaiting verification.

Do not create synthetic experiments solely to fill the inventory; prefer real omp-kit work and OMP-native telemetry.

## Related implementation / Issues

- `../architecture.md`
- `../workflows.md`
- `../VALIDATION.md`
- `verification.md`
- `../../.github/workflows/verify.yml`
- `../../skills/omp-workflow/SKILL.md`
- `../../skills/omp-workflow/references/execution.md`
- `../../skills/omp-workflow/references/self-improvement.md`
- Issue #4 — Main-only feedback capability boundary
- Issue #5 — natural worker-tool observations
- Issue #8 — delegation economics
- Issue #9 — recurring model-compensation/process ablation
- Issue #10 — completed context authority/provenance design
- Issue #11 — `.planning/` / issue-centered workflow coexistence
- Issue #18 — completed GitHub Actions deterministic gate

## Revisit triggers

Re-audit this record when:

- a major model generation materially changes planning, tool use, context recovery, or instruction following;
- OMP introduces a native capability that duplicates omp-kit policy/runtime logic;
- dogfood shows a rule adds latency/tokens/handoffs without new evidence;
- repeated failures show the current harness is under-constraining a mechanical or external-state obligation;
- event-triggered feedback misses reusable friction that the previous default reflection reliably surfaced;
- focused worker checks repeatedly miss failures that an early worker full gate would have caught materially sooner;
- CI becomes materially unreliable or diverges from repository-declared toolchain semantics.
