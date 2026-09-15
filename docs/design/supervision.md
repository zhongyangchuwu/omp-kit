# Supervision and waiting

## Problem

A director/worker design can be logically correct but economically poor if supervising Main repeatedly wakes only to discover that nothing decision-relevant changed. Progress messages can also interrupt a wait even when no decision is required.

These are coordination/runtime mechanics, not failures that should be solved by asking the model to `wait more carefully`.

## Evidence

### Community wait-cost report

**Type:** community report / anecdote.

A LINUX DO discussion reports one user's session where waiting/timeout activity consumed a large fraction of observed tokens/credits. The exact percentages come from one task and must not be generalized. The useful mechanism is the repeated pattern:

```text
short wait
-> supervisor wakes with context
-> worker not done
-> wait again
-> another expensive wake
```

The discussion proposes longer waits, cheaper orchestration, or separating planning/implementation/acceptance. It also contains the opposite warning: weak-worker repair loops can make delegation more expensive than direct strong-model work.

Reference: https://linux.do/t/topic/2894195

### Separate-session user workflow

**Type:** community report.

A separate community report similarly favors separating strong-model planning/acceptance from implementation rather than continuously supervising a subagent. This is user experience, not a controlled benchmark.

Reference: https://www.makerjackie.com/blog/2026-09-07-gpt6-astra

### OMP 18.2.0 `hub wait` semantics

**Type:** released-source/changelog inspection.

OMP 18.2.0 retains unified `hub wait` semantics in which a matching peer message can win the wait before a watched job settles. Therefore a routine peer progress message can still wake Main before the completion-related condition Main was conceptually waiting for.

Since 18.1.22, message/job waits use an OMP-owned adaptive window instead of a caller-supplied timeout: the window starts around 5 seconds and lengthens across back-to-back waits up to about 5 minutes. The old `timeoutMs` argument and `async.pollWaitDuration` setting were removed. In 18.2.0, process waits also report what they were actually blocked on when timing out, improving diagnostics without adding semantic completion filtering.

The peer-message contract still does not provide a general workflow-semantic kind such as:

```text
progress
decision-request
blocker
final
```

Main therefore still cannot ask the runtime to ignore routine progress while waking only on decision-relevant message classes. These remaining gaps stay in Issue #7 rather than being reimplemented in omp-kit.

### Stable final-result retrieval

**Type:** released documentation/source contract.

Released OMP provides:

```text
agent://<id>   -> saved final subagent output artifact
history://<id> -> concise live/parked subagent transcript
```

This is sufficient for omp-kit's stable post-settlement result-retrieval need. A convenient recent job row may still be lifecycle-oriented, but omp-kit does not need a parallel result ledger merely to recover a final output by stable agent identity.

### omp-kit persistent-worker evidence

**Type:** controlled project runtime evidence.

Native-foundation validation demonstrated a persistent `luna-code` workstream continuing across multiple related tasks and direct-message wakeups while preserving local context. This supports coherent worker reuse when task continuity exists.

Current summary: [validation](../VALIDATION.md). Original evidence: [immutable pre-cleanup report](https://github.com/zhongyangchuwu/omp-kit/blob/47a2951f47c9c55ce8f8cb020220288f9e28f871/docs/archive/native-foundation/VALIDATION_PHASE1_2026-09-13.md).

## Interpretation

Supervision should minimize model turns that exist only to observe the passage of time.

Useful wakeups are events that may change a decision:

```text
worker completed
worker failed
worker blocked
worker explicitly requests a decision
user changes intent
```

Routine progress can be useful for observability without necessarily requiring an immediate Main turn.

The durable boundary is runtime/event semantics, not a prose convention telling Main to be patient. Final-result retention should use the released OMP identity/artifact contract rather than preserve a local workaround for an older gap.

## Design principle

> Spend model turns on changed information or judgment, not polling.

Prefer OMP-native lifecycle, messaging, result artifacts and waiting semantics. Use bounded supervision checkpoints to avoid runaway silence, but do not build an omp-kit scheduler, message bus or result store around upstream primitives.

## Current mechanism

Current workflow guidance offers approximate first-checkpoint windows by task shape:

```text
quick    ~2m
standard ~5m
deep     ~10m
```

These are coordination hints, not completion promises, empirically optimal constants, or `hub wait` timeout settings. OMP 18.2.0 owns the actual adaptive wait window.

Guidance favors:

- letting the current OMP wait contract block instead of recreating a short polling loop;
- avoiding repeated supervisor turns on all-running snapshots with no new information;
- one checkpoint request after a meaningful task-level overrun;
- stop/split/escalate after repeated comparable overrun or stagnation;
- coherent worker reuse when task continuity justifies it;
- final-output retrieval through `agent://<id>` and transcript evidence through `history://<id>` when the released surfaces apply;
- actual OMP lifecycle rather than a local clone.

These are policy-level mitigations, not a claim of ideal event semantics.

## Evaluation / observed effect

Current evidence establishes persistent continuation in an exercised scenario, plausible and observed wakeup costs, the inspected wait/message limitations, and released final-output retrieval. OMP 18.1.22/18.2.0 removed the local timeout knob and improved waiting diagnostics, but did not resolve the completion-relevant message-filtering gap. Issue #7 therefore remains open with the same three semantic gaps.

A portable cost curve for checkpoint cadence and orchestration shapes across providers remains unestablished. That belongs with delegation economics (Issue #8) and natural real-work telemetry, not a synthetic waiting benchmark by default.

## Counter-evidence and limits

- Longer runtime waits reduce polling but can delay intervention when a worker is stuck.
- Progress messages sometimes contain a real blocker/decision in prose.
- Separate sessions can reduce supervision overhead while increasing context-transfer cost and losing local state.
- `agent://<id>` does not make recent job snapshots permanent or add semantic wait predicates.
- Community reports and checkpoint buckets are not portable performance constants.

## Current status

**Accepted local supervision policy; three runtime semantics remain tracked in inactive Issue #7.**

They concern semantic wait filtering, typed peer messages and per-agent read-only LSP. Stable settled final-output retrieval is resolved and should not be reimplemented locally.

## Related implementation / Issues

- `../../skills/omp-workflow/references/delegation.md`
- `../../skills/omp-workflow/references/execution.md`
- `../omp-runtime-notes.md`
- Issue #7 — remaining OMP coordination/configuration gaps
- Issue #8 — delegation economics/model routing

## Revisit triggers

Re-audit when OMP changes relevant event/message/read-only-LSP contracts, dogfood shows unacceptable checkpoint costs or stuck-worker latency, provider economics change, or the final-output contract changes materially.
