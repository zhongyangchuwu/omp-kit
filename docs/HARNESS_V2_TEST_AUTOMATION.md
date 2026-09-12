# Harness v2 test automation plan

## Purpose

Harness v2 validation mixes three kinds of evidence:

1. deterministic repository checks;
2. isolated installer/filesystem behavior;
3. live OMP/provider/session experiments.

The first two should become boring, repeatable local commands. The third stays
explicit and opt-in because it uses real profiles, credentials, provider requests and
session state. Automation should remove fixture copying, JSONL inspection, token
arithmetic, timeout bookkeeping and report transcription without pretending that a
live model experiment is a deterministic unit test.

This document is a maintenance plan, not evidence that every proposed script already
exists, and the tooling is not a Harness v2 merge gate. Implement the smallest pieces
that remove repeated manual work.

## Automation boundaries

### Automate fully

These operations are deterministic and safe to repeat:

- repository tests and static validation;
- isolated installer tests using temporary roots;
- fixture creation from checked-in pristine sources;
- checksums proving fixture/oracle sources were not changed;
- independent fixture scoring;
- read-only OMP session JSONL parsing;
- model/fallback/tool-call and history-access assertions;
- token, request-count and session-span aggregation;
- coordination/wait audit when an explicit parent session is supplied;
- tracked-working-tree checks;
- stable JSON evidence and Markdown rendering.

### Keep explicit and opt-in

These operations have real external or stateful effects:

- provider/model requests and CPA credentials;
- installation into a native OMP profile;
- reading a live `history://Main` route;
- spawning, messaging, cancelling or reviving custom workers;
- rollover and lifecycle experiments;
- browser relay or authenticated integrations.

They must never run from `just test`, `just verify` or ordinary CI.

### Do not automate into false confidence

- Do not create synthetic parent conversations when the question concerns a real Main
  session.
- Do not infer custom-agent discovery from YAML/filesystem layout alone.
- Do not decide runtime success from worker self-report when an independent scorer is
  available.
- Do not treat configured API-equivalent cost or raw tokens as ChatGPT quota usage.
- Do not treat a ranged history read as selective without reporting its aggregate span.
- Do not commit raw sessions, credentials, auth state or account-specific paths.
- Do not tune prompts/models automatically after a failed smoke.
- Do not turn one slow run into a global timeout/request-budget change.

## Repeated work worth removing

### Repository validation

The final local check repeatedly runs:

```bash
just test
just validate-harness
just check-registry
just validate-registry
git diff --check HEAD
```

Keep the individual recipes for narrow development loops, but expose one `just verify`
entry point for the combined deterministic gate.

### Runtime fixtures and oracle

Runtime experiments repeatedly need a fresh fixture, an independent scorer, proof that
old evidence was not modified, and a final tracked-tree cleanliness check. The Phase 2
cache fixture is reusable but must no longer depend on retained `/tmp` state.

Worker-visible inputs and the independent oracle must be physically separated. A worker
must not be able to discover the scoring contract merely by listing its fixture
working directory.

Recommended layout:

```text
tests/fixtures/harness_runtime/cache/
  worker/
    cache.py
    test_cache.py
  oracle/
    score.py
```

A prepared run mirrors that separation:

```text
/tmp/omp-kit-runtime-smoke-<id>/
  fixture/       # the only path given to the worker
  oracle/        # director/finalizer only
  manifest.json
  result.json    # written at finish
  report.md      # written at finish
```

Do not import old raw run directories, JSONL sessions or historical metrics.

### Session-record inspection

Manual experiments repeatedly recover:

- child session/agent identity;
- model role, resolved model, thinking level and fallback behavior;
- tool names/arguments and errors;
- history grep patterns/read selectors;
- usage buckets and assistant request counts;
- timestamps/session span;
- final structured result.

The search-first smoke also showed that `bounded read` is not the same as `small
context`: several ranged reads may cover nearly the whole resource. The audit must
report unique requested lines and approximate coverage when the resource length can be
established; selector presence alone is insufficient.

### Time and supervision bookkeeping

The earlier synthetic-parent experiment also showed that long `hub wait` periods can
dominate elapsed time without representing useful model work. Future evidence should
separate:

- child session span;
- assistant request count;
- worker task/result timing when available;
- parent `hub wait` arguments/results when an explicit parent JSONL is supplied;
- explicit indefinite waits (`timeoutMs: 0`);
- repeated coordination waits/polls;
- direct sends and job cancellation/intervention.

These fields support supervision policy; they are not a license to infer model latency
from one timestamp difference.

## Proposed command surface

### `just verify`

One deterministic final gate:

```text
just test
just validate-harness
just check-registry
just validate-registry
git diff --check HEAD
```

`just test` already includes installer tests, so do not run the installer-focused suite
again inside `verify`.

### `scripts/inspect_omp_session.py`

Read exactly one explicit JSONL path and emit stable JSON by default:

```bash
uv run python scripts/inspect_omp_session.py path/to/child.jsonl
uv run python scripts/inspect_omp_session.py path/to/child.jsonl \
  --expect-agent luna-code \
  --expect-model cpa/gpt-5.6-luna \
  --expect-thinking high \
  --forbid-fallback \
  --require-history-grep history://Main \
  --forbid-unbounded-history-read history://Main
```

Suggested stable output:

```text
audit_schema_version
omp_session_version
session_id
agent
model_role
initial_model
models_seen
thinking_levels_seen
fallback_observed
first_entry_at
last_entry_at
session_span_ms
assistant_request_count
tool_calls_by_name
tool_error_count
history_grep_patterns
history_read_selectors
history_grep_count
history_targeted_read_count
history_unbounded_read_count
history_requested_unique_lines
history_requested_span
history_coverage_ratio_when_length_known
hub_wait_count
hub_unbounded_wait_count
hub_send_count
hub_cancel_count
input_tokens
cache_read_tokens
cache_write_tokens
output_tokens
reasoning_tokens
total_tokens
unknown_entry_types
final_result
```

#### Session-tree rule

OMP session persistence is append-only JSONL whose entries form a tree through
`id`/`parentId`. A naïve scan can double-count discarded branches. Parser v1 should
support a linear child session only: reconstruct the path to the final leaf and fail
explicitly if the file contains a branch that would make the audited path ambiguous.
Do not silently sum every line in a branched file. A later version may implement
explicit leaf selection when real experiments require it.

#### Version and unknown-entry rule

Include both `audit_schema_version` and the OMP session header version. Fail on an
unsupported session version, malformed recognized entry, or missing evidence required
for a requested assertion. Unknown irrelevant entry types should be reported in
`unknown_entry_types` and otherwise ignored; they must not be converted to zero-valued
metrics or make the parser unusably brittle across harmless OMP additions.

#### Model trajectory

Do not collapse runtime identity to one scalar. Report the initial resolved model,
model transitions observed on the audited branch, thinking-level transitions and
whether any fallback was observed. A run that starts on Luna and later falls back must
not be reported simply as `model=Luna, fallback=false`.

#### Usage semantics

Aggregate persisted usage without double-counting:

- sum conversation assistant usage on the audited branch;
- include `model_usage` entries for model calls that are stored outside the normal
  conversation transcript;
- keep `reasoningTokens` as a reported subset of output, not an extra component added
  to total;
- prefer persisted `totalTokens` rather than reconstructing a different accounting
  formula when it is present.

Unknown usage fields remain unknown rather than being guessed.

#### Timing semantics

Use `session_span_ms` for first-to-last persisted entry. Do not call that value active
wall time: an idle persistent worker can have a long session span with little active
work. Report more precise task/lifecycle timing only when the JSONL actually provides
sufficient evidence.

#### Tool/history/coordination audit

Preserve call order. This allows policies such as grep-before-read to be evaluated.
Report explicit line selectors and the union of requested ranges. Coverage ratio is
emitted only when total transcript length is observable from retained evidence.

The same generic parser should recognize `hub` operations when they occur in the
session being inspected. An explicit `timeoutMs: 0` coordination wait is always
reported separately. Repeated short waits may be useful diagnostics but should not be
a hard failure without a policy that defines the context.

Policy failures return non-zero with exact reasons.

## Runtime fixture lifecycle

### `scripts/prepare_runtime_smoke.py`

Example:

```bash
uv run python scripts/prepare_runtime_smoke.py cache
```

Default to creating a unique run directory under the platform temporary directory and
print it. If `--output` is supported, require the destination to be absent or empty.
Do not offer a generic recursive `--force` that can wipe an arbitrary non-empty path.
A future replacement option may overwrite only a directory carrying a valid
omp-kit-owned runtime-smoke manifest.

Responsibilities:

- copy only `worker/` into the worker-visible `fixture/` directory;
- copy the oracle separately;
- write source commit, fixture/oracle checksums and creation time into `manifest.json`;
- record initial tracked-tree status;
- print fixture path and scorer command;
- never invoke OMP or read credentials.

### `scripts/finish_runtime_smoke.py`

Example:

```bash
uv run python scripts/finish_runtime_smoke.py \
  --run-dir /tmp/omp-kit-runtime-smoke-... \
  --session path/to/child.jsonl \
  --policy search-first-main-history
```

Optional future supervision audit:

```bash
  --parent-session path/to/main.jsonl \
  --coordination-policy bounded-supervision
```

Responsibilities:

1. validate the owned manifest and source/pristine checksums;
2. run the independent oracle and worker-visible focused test;
3. inspect the explicit child session;
4. apply the selected child policy assertions;
5. when explicitly supplied, inspect the parent session for coordination/wait evidence;
6. verify worker tool paths did not read the oracle or forbidden tracked docs;
7. compare current tracked-tree state with the manifest;
8. write stable `result.json` first and render `report.md` from it;
9. return non-zero on failed acceptance conditions.

Never guess the newest session when several OMP sessions may be active.

## Reusable policies

### `search-first-main-history`

Require:

- expected agent/model/thinking trajectory;
- no fallback;
- at least one `grep` whose path is exactly `history://Main`;
- no unbounded `read` of `history://Main`;
- any history read uses an explicit line selector and occurs after relevant search;
- independent scorer passes;
- worker does not access the separated oracle or forbidden answer-bearing docs;
- tracked omp-kit files remain unchanged.

Report without initially failing solely on:

- overlapping ranges;
- reads beyond transcript end;
- unique lines requested and coverage ratio;
- total tokens versus a user-supplied historical reference.

Do not invent a coverage threshold from the single 188-line smoke.

### `bounded-supervision`

This policy is evaluated only when the operator supplies the exact parent session. It
should initially require only evidence that no explicit indefinite worker-watching wait
(`timeoutMs: 0`) was used. Report:

- task spawn time/agent id when observable;
- `hub wait` requested timeout values and order;
- job/list status checks;
- direct sends/checkpoint interventions;
- cancellations;
- parent session span.

Do not fail merely because a worker exceeded an estimated checkpoint window: estimates
are control-plane hints, and the parent JSONL may not contain enough evidence to prove
whether a longer wait was justified. Tighten this policy only after several real runs.

## Test strategy

### Parser tests

Use synthetic offline JSONL fixtures covering:

- supported header/session version;
- a linear branch and a deliberately branched file that must fail v1 audit;
- initial model plus a model transition/fallback;
- thinking-level transitions;
- assistant usage plus `model_usage` aggregation;
- `reasoningTokens` remaining a subset of output;
- grep-before-read ordering;
- bounded and unbounded history reads;
- overlapping ranges and unique-line calculation;
- out-of-range reads;
- hub bounded wait and explicit `timeoutMs: 0`;
- malformed JSON and missing required evidence;
- unknown harmless entry type reported as a warning rather than a zero metric.

These tests must not invoke OMP or a provider.

### Preparation/finalization tests

Use isolated temporary directories and verify:

- unique directory creation and explicit-output collision refusal;
- worker/oracle physical separation;
- manifest/checksum generation;
- pristine source remains unchanged;
- scorer pass/failure propagation;
- explicit session path requirement;
- oracle/forbidden-path access detection from session tool calls;
- dirty tracked-state detection through an injected repository-status value rather than
  mutating the developer checkout;
- `result.json` is the source for the Markdown report.

### Live smoke

A live smoke remains a manual dispatch surrounded by automated preparation/finalization:

```text
prepare fixture
-> Main verifies history route
-> Main dispatches exactly one worker and chooses a rough checkpoint window
-> Main uses bounded coordination waits/status/checkpoint intervention as needed
-> worker completes or yields a blocker checkpoint
-> operator supplies exact child JSONL (and parent JSONL only when supervision is audited)
-> finish command scores and audits
```

A standalone script cannot replace the real parent conversation whose history and
coordination behavior are under test.

## Implementation order

### Stage 1 — deterministic gate and parser

1. Add `just verify`.
2. Add `scripts/inspect_omp_session.py` with audit schema version 1 and linear-session
   protection.
3. Add synthetic parser tests.
4. Validate locally against retained Phase 2/search-first records without committing
   those records.

### Stage 2 — durable fixture lifecycle

1. Promote the cache worker fixture and oracle into separated checked-in directories.
2. Add preparation/finalization scripts.
3. Add isolated filesystem tests.
4. Reproduce the existing scorer result from a fresh run directory.

### Stage 3 — opt-in runtime recipes and supervision evidence

Add only thin explicit recipes such as:

```text
runtime-smoke-prepare
runtime-smoke-finish SESSION=... [PARENT_SESSION=...]
```

Do not add a default recipe that launches paid/authenticated model traffic. Accumulate
request-count/session-span/wait evidence before changing global `task.softRequestBudget`
or `task.maxRuntimeMs` from their validated defaults/current configuration.

## Acceptance criteria

The automation batch is useful when:

- one deterministic command covers required repository checks;
- session metrics/history policy are derived without manual arithmetic;
- branched/unsupported sessions cannot silently corrupt metrics;
- model/fallback trajectories are represented accurately;
- worker-visible fixture and hidden oracle are isolated;
- a fresh runtime fixture no longer depends on retained `/tmp/omp-kit-phase2/` state;
- one explicit child record can be scored/audited into JSON and Markdown;
- optional parent evidence can expose indefinite waits and intervention history;
- failures are non-zero and identify violated conditions;
- ordinary tests remain offline and credential-free;
- live requests remain explicit/profile-scoped;
- raw account/session evidence remains untracked.

## Deferred ideas

Do not add without repeated need:

- a general benchmark database;
- automatic prompt tuning;
- a session daemon/custom scheduler;
- automatic newest-session discovery;
- CI provider calls;
- automatic cancellation based only on elapsed time;
- quota/billing inference;
- a second context subsystem.

The immediate value is a combined deterministic gate, one trustworthy session auditor,
one reusable isolated fixture/oracle lifecycle, and enough timing evidence to make future
time-budget tuning empirical rather than speculative.
