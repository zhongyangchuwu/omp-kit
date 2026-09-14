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

### OMP 18.1.20 `hub wait` semantics

**Type:** released-source inspection.

OMP 18.1.20 still defines unified `hub wait` as returning on the first of:

```text
matching peer message
watched job settling
wait-window expiry
steering interrupt
```

Therefore a normal peer progress message can wake Main before the completion-related condition Main was conceptually waiting for.

The released `IrcMessage` structure still carries routing/body/timestamp/reply metadata rather than a general workflow-semantic kind such as:

```text
progress
decision-request
blocker
final
```

Main therefore cannot ask the runtime to ignore routine progress while waking only on material message classes. These remaining runtime gaps stay in Issue #7 rather than being reimplemented in omp-kit.

### OMP 18.1.20 stable final-result retrieval

**Type:** released documentation/source contract.

One earlier coordination concern is now resolved in the supported runtime.

Released OMP 18.1.20 documents:

```text
agent://<id>   -> saved final subagent output artifact
history://<id> -> concise live/parked subagent transcript
```

For task subagents with an artifacts directory, OMP writes `<id>.md` and resolves it through `agent://<id>`. IDs are allocated by the session-scoped `AgentOutputManager`; nested outputs retain id-qualified paths.

This is sufficient for omp-kit's stable post-settlement result-retrieval need. A convenient recent `/jobs` row may still be lifecycle-oriented, but omp-kit no longer needs a parallel result ledger merely to recover a final output by stable agent identity.

### omp-kit persistent-worker evidence

**Type:** controlled project runtime evidence.

Archived native-foundation validation demonstrated a persistent `luna-code` workstream continuing across multiple related tasks and direct-message wakeups while preserving local context. This supports coherent worker reuse when task continuity exists.

Reference: `../archive/native-foundation/VALIDATION_PHASE1_2026-09-13.md`.

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

The durable boundary is therefore runtime/event semantics, not a prose convention telling Main to be patient.

At the same time, final-result retention should use the released OMP identity/artifact contract now that it exists rather than preserve a local workaround for an older gap.

## Design principle

> Spend model turns on changed information or judgment, not polling.

Prefer OMP-native lifecycle, messaging, result artifacts and waiting semantics. Use bounded supervision checkpoints to avoid runaway silence, but do not build an omp-kit scheduler, message bus or result store around upstream primitives.

## Current mechanism

Current omp-kit supervision guidance uses bounded first-checkpoint windows roughly aligned with task shape:

```text
quick    ~2m
standard ~5m
deep     ~10m
```

Guidance favors:

- one coherent bounded wait roughly matching the checkpoint;
- avoiding short repeated polling;
- one checkpoint request after a meaningful overrun;
- stop/split/escalate after repeated comparable overrun or stagnation;
- reusing a coherent worker when task continuity justifies it;
- retrieving final output through `agent://<id>` and transcript evidence through `history://<id>` when those released surfaces apply;
- using actual OMP task/hub/session lifecycle rather than a local clone.

These are policy-level mitigations, not a claim that OMP 18.1.20 has ideal event semantics.

## Evaluation / observed effect

Current evidence establishes:

- persistent worker continuation can function correctly;
- short/repeated supervisor wakeups have plausible and observed cost;
- OMP 18.1.20 `hub wait` can still wake on any matching peer message;
- peer messages still lack a general semantic workflow kind;
- stable settled final-output retrieval by agent id is now a released OMP capability through `agent://<id>`.

Issue #7 therefore narrowed from four tracked gaps to three. No omp-kit compatibility layer was added for the resolved result-retrieval concern.

What remains unestablished is a portable cost curve for different wait durations or orchestration shapes across models/providers. That belongs with delegation economics (Issue #8) and natural real-work telemetry, not a synthetic waiting benchmark by default.

## Counter-evidence and limits

- Long waits can reduce polling but delay intervention when a worker is genuinely stuck; bounded checkpoints still matter.
- Progress messages sometimes contain a real blocker/decision request in prose because message kinds are not structured today.
- Separate sessions can reduce live-supervisor overhead but increase explicit context-transfer cost and lose local state.
- `agent://<id>` solves stable final-output retrieval; it does not make recent job snapshots permanent or add semantic wait predicates.
- Community wait-cost reports are not portable performance constants.

## Current status

**Accepted local supervision policy; three runtime semantics remain upstream-limited.**

Active Issue #7 gaps on OMP 18.1.20:

1. wait cannot filter by workflow-semantic message class;
2. peer messages lack a first-class progress/blocker/decision/final kind;
3. ordinary custom-agent frontmatter still cannot express per-agent `lspReadOnly`.

Stable settled Agent-ID final-output retrieval is resolved and should not be reimplemented locally.

## Related implementation / Issues

- `../../skills/omp-workflow/references/delegation.md`
- `../../skills/omp-workflow/references/execution.md`
- `../omp-runtime-notes.md`
- Issue #7 — remaining OMP coordination/configuration gaps
- Issue #8 — delegation economics/model routing

## Revisit triggers

Re-audit this record when:

- OMP adds terminal-only/event-filtered wait semantics;
- peer messages gain semantic kinds;
- ordinary agent configuration gains per-agent read-only LSP;
- dogfood shows current checkpoint windows cause either excessive polling or unacceptable stuck-worker latency;
- model/provider economics materially change supervisor-wakeup cost;
- the `agent://` final-output contract changes materially.
