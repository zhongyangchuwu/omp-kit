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

## Upstream capability boundary

OMP should own OMP format/runtime semantics; omp-kit should own only Harness-specific
policy, fixture isolation and independent scoring. Local capability probes against the
installed OMP 18.1.18 environment established:

- `omp stats --json` works and is the authoritative local aggregate for requests,
  errors, tokens, cache, duration and model/folder summaries;
- the separate Python `omp-rpc` package is not installed in the current project/runtime
  environment, so a live RPC runner cannot be assumed available;
- Bun resolves `@oh-my-pi/pi-coding-agent/session/session-manager` and
  `session/session-loader`, but importing either from the global package cache currently
  fails because the matching `pi_natives` addon is absent there;
- no package, native addon or external runtime dependency was installed merely to make
  the probe pass.

Decision: keep `inspect_omp_session.py` as a deliberately narrow version-3/linear-session
fallback for current policy evidence. Do not add branch reconstruction, migrations,
general corpus statistics or broader OMP compatibility semantics to it. Revisit an
upstream TypeScript loader only when the installed package can execute cleanly, and
adopt `omp-rpc` for live smoke orchestration only after its dependency/install contract
is explicit and reproducible.

## Automation boundaries

### Automate fully

These operations are deterministic and safe to repeat:

- repository tests and static validation;
- isolated installer tests using temporary roots;
- fixture creation from checked-in pristine sources;
- checksums proving fixture/oracle sources were not changed;
- independent fixture scoring;
- narrow policy-oriented inspection of an explicitly supplied OMP v3 linear child record;
- model/fallback/tool-call and history-access assertions;
- persisted per-session usage and session-span evidence needed by one audit;
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
uv run python scripts/inspect_omp_session.py path/to/child.jsonl \
  --expect-agent luna-code \
  --expect-only-task-model cpa/gpt-5.6-luna \
  --expect-thinking high \
  --forbid-fallback \
  --require-history-grep history://Main \
  --forbid-unbounded-history-read history://Main \
  --require-grep-before-history-read
```

`--expect-model` remains a compatibility alias for `--expect-only-task-model`; its
meaning is strict trajectory validation, not "the model appeared at least once".
Use `--expect-final-task-model` only when final-state validation is explicitly desired.

Suggested stable output includes:

```text
audit_schema_version
omp_session_version
session_id
agent
model_role
initial_model
initial_model_effort
initial_resolved_model
model_trajectory
task_request_model_events
task_models_seen
final_task_model
auxiliary_model_usage_events
thinking_levels_seen
fallback_observed
fallback_evidence_complete
first_entry_at
last_entry_at
session_span_ms
assistant_request_count
tool_calls_by_name
tool_error_count
history_grep_patterns
history_successful_grep_count
history_read_selectors
history_read_selector_details
history_targeted_read_count
history_open_ended_read_count
history_unsupported_selector_count
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
support a linear child session only and fail explicitly if the file contains a branch
that would make the audited path ambiguous. Do not silently sum every line in a
branched file. A later version may implement explicit leaf selection when real
experiments require it.

#### Version and unknown-entry rule

Include both `audit_schema_version` and the OMP session header version. Fail on an
unsupported session version, malformed recognized entry, or missing evidence required
for a requested assertion. Unknown irrelevant entry types should be reported in
`unknown_entry_types` and otherwise ignored; they must not be converted to zero-valued
metrics or make the parser unusably brittle across harmless OMP additions.

#### Model trajectory and fallback evidence

Do not collapse runtime identity to one scalar. Keep ordered task-model evidence from
`session_init`, `model_change`, and assistant requests. Keep auxiliary `model_usage`
(title/tiny/etc.) separate so those calls cannot change task-model assertions.

OMP may persist an effort suffix in `session_init.resolvedModel` (for example,
`cpa/gpt-5.6-luna:high`) while assistant request events identify the same model as
`cpa/gpt-5.6-luna`. Normalize only recognized OMP effort suffixes for task-model
comparison, preserve the raw resolved value, and report the extracted effort separately.

A strict task-model assertion means every observed task model must equal the expected
model. A Luna-to-Sol transition must fail an "only Luna" assertion even when neither
transition is a fallback.

`--forbid-fallback` is evidence-based: an observed fallback fails, but missing fallback
metadata also fails the assertion because the tool cannot prove absence of fallback.
Do not convert absent metadata into `false`.

#### Usage semantics

Use `omp stats --json` for general installation-wide and corpus-level request/token/cache
statistics. The fallback auditor aggregates only persisted usage belonging to its one
explicit linear session so a smoke report can remain self-contained:

- sum conversation assistant usage on the audited branch;
- include `model_usage` entries for model calls stored outside the normal conversation;
- keep `reasoningTokens` as a reported subset of output, not an extra component added
  to total;
- prefer persisted `totalTokens` rather than reconstructing a different formula.

This narrow aggregation is not a replacement for OMP stats and must not grow into a
second corpus statistics implementation. Unknown usage fields remain unknown rather
than being guessed.

#### Timing semantics

Use `session_span_ms` for first-to-last persisted entry. Do not call that value active
wall time: an idle persistent worker can have a long session span with little active
work. Report more precise task/lifecycle timing only when the JSONL actually provides
sufficient evidence.

#### Tool/history/coordination audit

Preserve assistant-entry and tool-result order, not just tool-call order within one
assistant message. `grep-before-read` is causal: at least one matching grep must finish
successfully before the assistant entry that issues the first history read. A parallel
same-message `grep` + `read` is therefore not compliant.

Every `read` path equal to the history base or starting with `history-base + ':'` must
be classified. Supported bounded selectors are:

```text
:start-end
:start+count
:-count
```

Bare history reads are unbounded. `:start` and `:start-` are open-ended. Unknown forms
such as `:raw:...` are unsupported selectors. Search-first policy must not silently
ignore open-ended or unsupported selectors.

Range coverage must use interval merge rather than materializing every line number, so
malformed or model-generated huge ranges cannot exhaust memory. Coverage is clipped to
the known resource length only for ratio calculation; the raw requested span remains
observable.

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

- expected agent/task-model/thinking trajectory;
- complete fallback evidence and no fallback;
- at least one `grep` whose path is exactly `history://Main`;
- at least one successful matching grep result before the first history read;
- no bare, open-ended, or unsupported `read` selector for `history://Main`;
- any allowed history read uses a supported bounded selector;
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
- initial model plus model transition/fallback;
- strict task-model trajectory checks and final-task-model checks;
- missing fallback metadata under `--forbid-fallback`;
- auxiliary title/tiny `model_usage` excluded from task-model assertions;
- thinking-level transitions;
- assistant usage plus `model_usage` aggregation;
- `reasoningTokens` remaining a subset of output;
- same-message grep+read failing causal ordering;
- successful grep-result then later read passing;
- failed grep-result then read failing;
- `:start-end`, `:start+count`, `:start-`, `:start`, `:-count`, `:raw:...`, and unknown selectors;
- huge ranges using interval merge rather than line-by-line expansion;
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

### Stage 1 — deterministic gate and bounded fallback auditor

Implemented:

1. `just verify` provides the deterministic repository gate.
2. `scripts/inspect_omp_session.py` provides audit schema v1 for explicit OMP v3 linear
   records and Harness-specific assertions.
3. Synthetic regressions cover the known false-PASS paths.
4. The retained SearchFirst record is the real compatibility check, including OMP's
   effort-suffixed `session_init.resolvedModel` representation.

Stage 1 is intentionally frozen at this boundary. New OMP format/tree/migration/statistics
requirements should trigger upstream integration research, not automatic Python parser
expansion.

### Stage 2 — durable fixture lifecycle — DEFERRED UNTIL A REAL TRIGGER

This is not a current merge requirement. If repeated runtime-smoke work creates a real
need, then:

1. Promote the cache worker fixture and oracle into separated checked-in directories.
2. Add preparation/finalization scripts.
3. Add isolated filesystem tests.
4. Reproduce the existing scorer result from a fresh run directory.

### Stage 3 — opt-in runtime runner and supervision evidence — DEFERRED UNTIL A REAL TRIGGER

Prefer an `omp-rpc` runner only when that official Python package has an explicit
reproducible dependency path. It can own OMP process lifecycle, timeout/abort, subagent
subscription, progress and session statistics while omp-kit supplies only the prompt
policy, fixture scope and scorer.

Until then, keep live dispatch manual. Thin preparation/finalization recipes may be
added only after a concrete trigger:

```text
runtime-smoke-prepare
runtime-smoke-finish SESSION=... [PARENT_SESSION=...]
```

Do not launch paid/authenticated model traffic from ordinary tests or `just verify`.
Accumulate request-count/session-span/wait evidence before changing global
`task.softRequestBudget` or `task.maxRuntimeMs`.

## Acceptance criteria

The current Stage 1 automation batch is useful when:

- one deterministic command covers required repository checks;
- session metrics/history policy are derived without manual arithmetic;
- branched/unsupported sessions cannot silently corrupt metrics;
- grep-before-read proves a successful search result preceded the first read;
- every history selector is classified and policy-relevant unknowns cannot disappear;
- model/fallback/thinking trajectories are represented accurately and incomplete or
  conflicting evidence fails strict assertions;
- huge history ranges cannot cause line-set memory blowups;
- one explicit child record can be scored/audited into JSON and Markdown;
- failures are non-zero and identify violated conditions;
- ordinary tests remain offline and credential-free;
- live requests remain explicit/profile-scoped;
- raw account/session evidence remains untracked.

Stage 2 and Stage 3 are deferred until a real runtime-smoke or lifecycle trigger exists.
Their fixture isolation, fresh-run lifecycle and parent-supervision criteria are not
current merge requirements.


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

The immediate value is the combined deterministic gate, one trustworthy session auditor
and retained real-session evidence. Durable fixture lifecycle and runtime-runner work
remain deferred until repeated runtime-smoke needs justify them.
