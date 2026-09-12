# Harness v2 test automation plan

## Purpose

Harness v2 validation currently mixes three different kinds of evidence:

1. deterministic repository checks;
2. isolated installer/filesystem behavior;
3. live OMP/provider/session experiments.

The first two should become one boring, repeatable local command. The third should remain explicit and opt-in because it uses real profiles, credentials, provider requests and session state. Automation should remove fixture copying, JSONL inspection, token arithmetic and report transcription without pretending that a live model experiment is a deterministic unit test.

This document records the reusable lessons from the Harness v2 validation work and proposes the smallest useful automation surface. It is a plan, not evidence that the proposed scripts already exist, and it does not make new tooling a Harness v2 merge gate. Implement it as a separate maintenance batch when repeated validation work resumes.

## Repeated work observed

### Repository validation

The same command sequence has been run after coherent installer/config changes:

```bash
uv run python -m pytest -q tests/test_install_harness.py
just test
just validate-harness
just check-registry
just validate-registry
git diff --check
```

The individual commands are useful during development, but final verification should not depend on remembering their order or manually copying their output.

### Runtime fixture handling

The runtime experiments repeatedly required:

- locating a pristine fixture and independent scorer;
- copying the fixture into a fresh `/tmp` run directory;
- proving that earlier evidence was not modified;
- dispatching a worker against only the fresh copy;
- running the worker's focused test;
- running an independent scorer;
- confirming the tracked repository stayed clean.

The Phase 2 cache fixture and scorer were reusable, but they existed only under `/tmp/omp-kit-phase2/`. That made reuse dependent on one workstation's retained temporary files.

### Session-record inspection

Each worker experiment required manual inspection of OMP JSONL records to recover:

- child session id;
- actual model and thinking level;
- `resolvedModelIsFallback`;
- tool names and arguments;
- history grep patterns and read selectors;
- input/cache/output/reasoning/total tokens;
- timestamps and wall time;
- the final structured worker result.

The search-first smoke demonstrated why this needs semantic checks rather than a simple call count. It passed the formal requirement of no unbounded `read history://Main`, but five ranged reads collectively covered most of the 188-line transcript. It also consumed 642,661 total child tokens, compared descriptively with 200,731 in the earlier whole-history smoke. A future audit should therefore report unique history lines requested and approximate coverage, not only whether a selector was present.

### Reporting

Runtime reports were assembled by hand from command output, session JSONL, worker summaries and independent scorer results. This is error-prone because provider usage fields use exact names such as `reasoningTokens`, while prose reports use friendlier labels. Generated evidence should be machine-readable first and rendered to Markdown second.

## Automation boundaries

### Automate fully

These operations are deterministic and safe to run repeatedly:

- repository tests and static validation;
- isolated installer tests using temporary roots;
- fixture creation from a checked-in pristine source;
- checksums proving source fixtures and prior evidence were not changed;
- independent fixture scoring;
- OMP session JSONL parsing;
- model/fallback/tool-call policy assertions;
- token and timestamp aggregation;
- tracked-working-tree checks;
- Markdown report rendering from structured results.

### Keep explicit and opt-in

These operations have real external or stateful effects:

- provider/model requests;
- use of CPA credentials;
- installation into a native OMP profile;
- reading a live `history://Main` route;
- spawning custom workers;
- rollover, continuation and lifecycle experiments;
- browser relay or other authenticated integrations.

They must require an explicit profile and an explicit live-test flag. They must never run from `just test` or ordinary CI.

### Do not automate into false confidence

Avoid a large benchmark framework or a script that silently decides runtime success from worker self-report. In particular:

- do not create synthetic parent conversations when the question concerns the real Main session;
- do not infer custom-agent discovery from YAML or filesystem layout alone;
- do not treat configured API-equivalent cost as account quota usage;
- do not treat a ranged history read as selective without measuring its span;
- do not commit raw sessions, credentials, auth state or account-specific paths;
- do not tune prompts/models automatically after a failed smoke; preserve one-run diagnostic value.

## Proposed command surface

### `just verify`

Add one final deterministic gate that invokes the existing canonical commands:

```text
just test
just validate-harness
just check-registry
just validate-registry
git diff --check
```

The target should fail fast and preserve each underlying command's output. Keep `test`, `validate-harness`, `check-registry` and `validate-registry` available for narrow development loops.

Do not run the installer-focused test suite separately inside `just verify` because `just test` already includes it. The focused command remains useful when changing `scripts/install_harness.py`.

### `scripts/inspect_omp_session.py`

Add a read-only parser for one child JSONL record. Suggested interface:

```bash
uv run python scripts/inspect_omp_session.py path/to/child.jsonl
uv run python scripts/inspect_omp_session.py path/to/child.jsonl \
  --expect-model cpa/gpt-5.6-luna \
  --expect-thinking high \
  --forbid-fallback \
  --require-history-grep history://Main \
  --forbid-unbounded-history-read history://Main
```

It should emit stable JSON by default and optionally render Markdown. Required fields:

```text
session_id
model
thinking_level
resolved_model_is_fallback
started_at
finished_at
wall_time_ms
tool_calls_by_name
history_grep_patterns
history_read_selectors
history_grep_count
history_targeted_read_count
history_unbounded_read_count
history_requested_unique_lines
history_requested_span
history_coverage_ratio_when_length_known
input_tokens
cache_read_tokens
cache_write_tokens
output_tokens
reasoning_tokens
total_tokens
final_result
```

Policy failures should produce a non-zero exit code with an exact reason. Unknown or changed JSONL event shapes should fail explicitly rather than producing zero-valued metrics.

### Durable runtime fixture

Promote only the reusable Phase 2 cache fixture and independent oracle into a small checked-in test-data directory, for example:

```text
tests/fixtures/harness_runtime/cache/
  cache.py
  test_cache.py
  score.py
```

The fixture should remain intentionally incomplete: it exists to test whether a worker recovers accepted decisions without implementing rejected or unresolved behavior. The scorer is the contract; the worker-visible test remains narrower.

Do not import the old raw Phase 2 run directory, session records, generated copies or metrics.

### `scripts/prepare_runtime_smoke.py`

Add a filesystem-only preparation command:

```bash
uv run python scripts/prepare_runtime_smoke.py cache \
  --output /tmp/omp-kit-runtime-smoke
```

Responsibilities:

- refuse a non-empty destination unless `--force` is explicitly supplied;
- copy the pristine fixture and scorer;
- write a manifest containing source commit, source checksums and creation time;
- record the initial tracked-tree status;
- print the fresh fixture path and scorer command;
- never invoke OMP or read credentials.

### `scripts/finish_runtime_smoke.py`

Add an evidence collector that consumes the prepared manifest and one explicit child session record:

```bash
uv run python scripts/finish_runtime_smoke.py \
  --run-dir /tmp/omp-kit-runtime-smoke \
  --session path/to/child.jsonl \
  --policy search-first-main-history
```

Responsibilities:

1. verify the source and pristine fixture checksums;
2. run the independent scorer and focused fixture test;
3. call the session-record parser;
4. apply the selected policy assertions;
5. compare current tracked-tree state with the manifest;
6. write `result.json` and `report.md` in the run directory;
7. return non-zero on any failed acceptance condition.

The command must consume an explicit session path. Guessing "the newest session" is unsafe when several OMP sessions are active.

## Search-first policy checks

The reusable `search-first-main-history` policy should require:

- actual child model matches the expected role resolution;
- thinking level matches configuration;
- no fallback;
- at least one `grep` call whose path is exactly `history://Main`;
- no `read` call whose path is exactly `history://Main`;
- every history read uses an explicit line selector;
- every targeted read occurs after the first matching grep;
- independent scorer passes;
- tracked omp-kit files are unchanged.

It should additionally report, but initially not fail solely on:

- overlapping ranges;
- reads beyond the transcript end;
- number of unique lines requested;
- percentage of the transcript requested when total length is observable;
- total tokens compared with a user-supplied historical reference.

After several real runs establish a reasonable baseline, a coverage threshold may become a policy failure. Setting one from the single 188-line smoke would overfit the experiment.

## Test strategy for the automation

### Parser tests

Use small synthetic JSONL fixtures covering:

- expected model/thinking/fallback events;
- multiple assistant usage records summed correctly;
- `reasoningTokens` mapped correctly;
- grep-before-read ordering;
- bounded and unbounded history reads;
- overlapping ranges and unique-line calculation;
- an out-of-range read result;
- malformed JSON and missing required events;
- a changed/unknown event shape producing an explicit error.

These tests should not invoke OMP or a provider.

### Preparation/finalization tests

Use isolated temporary directories and verify:

- destination collision refusal;
- manifest/checksum generation;
- pristine source remains unchanged;
- scorer pass and failure propagation;
- explicit session path requirement;
- dirty tracked-state detection through an injected repository-status value rather than mutating the developer's checkout;
- reports contain only declared stable fields.

### Live smoke

A live smoke remains a documented manual dispatch surrounded by automated preparation and finalization:

```text
prepare fixture
→ Main verifies history route
→ Main dispatches exactly one worker
→ worker completes
→ operator supplies exact child JSONL path
→ finish command scores and audits
```

This preserves the same-session `history://Main` property. A standalone shell process cannot replace the parent conversation whose retrieval policy is being tested.

## Implementation order

### Stage 1 — deterministic gate and parser

1. Add `just verify`.
2. Add `scripts/inspect_omp_session.py`.
3. Add synthetic parser tests.
4. Validate the parser against retained Phase 2 and search-first session records locally without checking those records into Git.

This stage removes the most repeated manual work and has no provider side effects.

### Stage 2 — durable fixture lifecycle

1. Promote the cache fixture and scorer into `tests/fixtures/harness_runtime/`.
2. Add preparation and finalization scripts.
3. Add isolated filesystem tests.
4. Reproduce the existing cache scorer result from a fresh temporary run directory.

### Stage 3 — opt-in runtime recipes

Add `just` recipes only as thin, explicit entry points, for example:

```text
runtime-smoke-prepare
runtime-smoke-finish SESSION=...
```

Do not add a default recipe that launches paid/authenticated model traffic. If OMP later exposes a stable API for selecting a live parent session and returning child record paths, reassess whether dispatch can be automated safely.

## Acceptance criteria

The automation plan is complete when:

- one deterministic command covers the repository's required combined checks;
- session metrics and history-access policy are derived from JSONL without manual arithmetic;
- a fresh runtime fixture can be prepared without relying on retained `/tmp/omp-kit-phase2/` artifacts;
- one explicit child record can be independently scored and audited into JSON and Markdown;
- failures are non-zero and name the violated condition;
- ordinary tests remain offline, credential-free and isolated;
- live runtime requests remain explicit and profile-scoped;
- raw account/session evidence remains untracked.

## Deferred ideas

Do not add these without repeated need:

- a general benchmark database;
- automatic prompt tuning;
- a session daemon or custom scheduler;
- automatic discovery of the latest child record;
- CI provider calls;
- quota or billing inference;
- a second context subsystem.

The immediate value is a small parser, one reusable fixture lifecycle and one combined deterministic verification command.
