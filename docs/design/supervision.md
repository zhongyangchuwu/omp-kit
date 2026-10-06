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

### OMP 18.2.x `hub wait` semantics

**Type:** released-source/changelog inspection.

The wait/message behavior below was directly inspected on OMP 18.2.0. The
subsequent review through then-pinned 18.2.3 identified no change resolving
these gaps. On that runtime, a matching peer message could win `hub wait`
before a watched job settled and wake Main on routine progress traffic.

Since 18.1.22, those message/job waits used an OMP-owned adaptive window
instead of a caller-supplied timeout: roughly 5 seconds to 5 minutes across
back-to-back waits. The old `timeoutMs` argument and `async.pollWaitDuration`
setting were removed. In 18.2.0, process waits also reported what they were
blocked on when timing out. These are historical 18.2.x mechanics, not the
current `wait` contract described below.

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

Prefer OMP-native lifecycle, messaging, result artifacts and waiting semantics. Main intervenes on observed failure, blockers or stagnation; omp-kit does not provide a scheduler, polling cadence, message bus or result store.

## Current mechanism

OMP 18.6.1 owns progress/completion estimates and background-job settlement.
Results and messages auto-deliver. `wait` accepts only the caller's own background
jobs/services and errors when none exist; it is not a peer-only polling API.
The workflow therefore no longer repeats wait ladders or fixed 2/5/10-minute
checkpoint buckets as operating instructions.

Main continues useful work while workers run. When blocked, it uses native
waiting; when a delivered failure, blocker or stalled task needs intervention,
it obtains a non-consuming status snapshot and asks for a concrete checkpoint.
Repeated stagnation follows the bounded-executor escalation contract. Stable
outputs and exact same-session evidence use `agent://` and `history://`;
cross-session retrieval uses the native read-only `archive` eval global.

This removes duplicated runtime mechanics, not Main's judgment or the unresolved
semantic-message/read-only-LSP boundaries.

## Evaluation / observed effect

Earlier OMP 18.1.22/18.2.0 removed the local timeout knob and improved waiting
diagnostics. OMP 18.3.0 replaced `hub` with `wait`, `proc://` status/control and
`agent://` messaging. OMP 18.4.0 temporarily restored an adaptive window for
waits without owned jobs/services. OMP 18.5.1 removed that peer-only path by
requiring owned background work; 18.6.1 makes subagent follow-up responses
waitable/cancellable jobs delivered once. These are release-specific source
findings, not proof of ideal decision-relevance filtering or portable wait cost.

A portable cost curve for checkpoint cadence and orchestration shapes across providers remains unestablished. That belongs with delegation economics (Issue #8) and natural real-work telemetry, not a synthetic waiting benchmark by default.

## Counter-evidence and limits

- Longer runtime waits reduce polling but can delay intervention when a worker is stuck.
- Progress messages sometimes contain a real blocker/decision in prose.
- Separate sessions can reduce supervision overhead while increasing context-transfer cost and losing local state.
- `agent://<id>` does not make recent job snapshots permanent or add semantic wait predicates.
- Community reports and the retired local checkpoint buckets are not portable performance constants.

## Current status

**Accepted native-first supervision policy; runtime gaps remain tracked in
inactive Issue #7.** The OMP 18.6.1 owned-job wait and native progress surfaces
supersede local wait-ladder/checkpoint instructions. Semantic peer-message
filtering and runtime-enforced per-agent read-only LSP remain distinct questions;
this upgrade does not declare the Issue complete.

## Related implementation / Issues

- `../../skills/omp-workflow/references/delegation.md`
- `../../skills/omp-workflow/references/execution.md`
- `../omp-runtime-notes.md`
- Issue #7 — remaining OMP coordination/configuration gaps
- Issue #8 — delegation economics/model routing

## Revisit triggers

Re-audit when OMP changes relevant event/message/read-only-LSP contracts, dogfood shows unacceptable checkpoint costs or stuck-worker latency, provider economics change, or the final-output contract changes materially.
