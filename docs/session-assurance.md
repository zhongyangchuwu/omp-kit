# Session assurance: initial report

This is the first usable report slice of #31, built on the shared
[session access](session-access.md) layer. It is an evidence snapshot, not a
security audit, task-completion certificate or permission decision.

## Current-session commands

Normal interactive use does not require locating a session id or JSONL path:

```text
/assurance
/assurance full
```

`/assurance` is cheap current active-branch triage. `/assurance full` is
current-session investigation: it keeps the existing full trace/Scope enrichment and
also reads the public retained Main-session entries through `sessionManager`. Retained
entries preserve their parent/child structure and are marked `active` or
`off-branch`; sibling branches are not flattened into a causal timeline.

Both commands persist regenerable private output under the active OMP agent root:

```text
<agent-dir>/omp-kit/assurance/<session-id>/
  scan.txt
  scan.json
  full.txt
  full.json
```

The files are derived cache/output, not a second session store. OMP remains authoritative
for raw sessions. Re-running the same mode overwrites its derived pair.

Full investigation is deliberately asymmetric: the current Main session can expose its
retained entries, while child/subagent retained-history completeness is not established
by the current public trace surface. That limitation stays explicit in Runtime/Coverage.

For retained Main-session tool calls, full investigation also derives bounded facts from
the structured public entries: tool identity, terminal/error observation, active versus
off-branch location, and descriptors from the existing Scope V1 classifiers when their
tool contracts apply. Raw tool arguments and results are used only in memory and are not
copied into the report. Unsupported tools such as generic shell remain unclassified. Retained entries do
not expose a historical workspace root per entry, so the retained-tree classifier does
not reuse the current cwd to reinterpret old absolute paths; that uncertainty is
reported explicitly. Relative file targets can still be described as workspace-relative.
These descriptors are observed declared targets, not authorization or proof of every
transitive effect.

A parent-observed terminal job snapshot is also usable lifecycle evidence. In particular,
a background span that lacks `async-result` is not called unresolved when the retained
Main-session evidence already records that job as `completed`, `failed`, or
`cancelled`. The raw missing-terminal trace observation remains supporting Evidence.


## Developer and batch CLI

Single-session full report:

```bash
bun run assurance:report -- --session /absolute/path/to/session.jsonl
bun run assurance:report -- --session /absolute/path/to/session.jsonl --json
omp-kit-assurance --session /absolute/path/to/session.jsonl
```

Historical first-pass scan:

```bash
bun run assurance:scan
bun run assurance:scan -- --since 2026-09-01T00:00:00Z
bun run assurance:scan -- --folder /path/to/project --limit 1000 --json
omp-kit-assurance scan --since 2026-09-01T00:00:00Z
```

The scan emits opaque session keys rather than copying session-file paths into the
report. A candidate can be reopened as a normal full report:

```bash
omp-kit-assurance --key <session-key>
```

`--key` synchronizes and searches the same bounded public OMP session catalog used by
the scan. If the catalog reaches `--limit`, the scan reports that limitation rather
than claiming exhaustive history.

### Why scan is trace-only by default

A full Scope V1 report may read selected public session entries for each tool action
and walk a bounded parent chain to recover structured tool-call input. That is useful
for one session, but multiplying it across a large history can create many local
entry reads. On the OMP 18.2.5 compatibility candidate, built-in full scans first use the trace tool label as a
conservative prefilter: tool names that no built-in Scope V1 classifier supports are
recorded as `unsupported-tool` without selected-entry recovery. Supported tool names
still recover structured arguments before classification.

The default scan therefore performs a cheap first pass:

```text
sync + bounded session list
-> matching active-branch trace per session
-> tool-error / terminal-missing / resolution-gap / coverage-conflict rules
-> keep tool-error as supporting evidence; select candidates from attention/dynamic coverage
-> aggregate counts + candidate session keys
-> full Scope V1 drill-down only where useful
```

It does **not** run the scope classifiers or read selected entries. Use `scan --full`
only when bulk Scope V1 enrichment is intentionally worth that cost. This is still a
local read-only analysis surface; it does not run models, tests or publication.

The explicit-session form remains supported. The session file must belong to the
selected OMP profile's supported session store. It is an identifier passed to public
OMP stats/session APIs, not a file parsed by omp-kit. An already running local server
can be selected with `--origin http://127.0.0.1:3847`. Otherwise the command temporarily
owns a local OMP stats server and releases it afterwards. Native server startup/sync
may update OMP's local stats.

The command reads active-branch traces. For full observed-scope enrichment it may also
fetch selected entries by native entry id and follow a bounded parent chain to recover
the matching structured tool call in memory. Raw arguments and paths are not copied
into the assurance report. It does not run checks, invoke models or publish data.
Single-session reads use a 15-second abort signal; server startup/cleanup is still
controlled by OMP.

Exit 0 means the requested report/scan was produced, including when tool errors or
attention findings exist. Exit 2 indicates incomplete discovery, an unassessed trace
read, or rule failure. Neither exit code is a safety verdict. Failed trace reads still
produce coverage information where possible; startup/usage errors produce a bounded
generic diagnostic. `--help` performs no profile or stats access.

## Batch scan output

`omp-kit.session-assurance-scan/v1` is deliberately a compact index over per-session
assurance results rather than another raw trace store. It contains:

- scan mode (`trace-only` or explicit `full`);
- bounded catalog/discovery status and limitations;
- filter presence, `since`, and requested limit;
- scanned/assessed/candidate counts;
- aggregate action, subagent, attention-finding and dynamic-coverage-gap counts;
- optional full-scan scope diagnostics (`candidates`, prefiltered unsupported actions,
  recovery attempts, actual entry reads/cache hits, parent hops and timing);
- finding-code counts;
- candidate rows with opaque session key, timestamps and bounded finding codes.

The candidate list does not copy session paths, cwd, titles, tool arguments, outputs
or trace previews. Default trace limitations such as active-branch-only coverage are
counted but do not make every session an attention candidate. Dynamic gaps such as a
failed read or conflicting observation do. Rule presentation is carried in each rule result, so historical triage can distinguish `attention`, supporting `evidence`, and `coverage` without hard-coding rule IDs. A supporting-evidence finding remains counted and is included as context on a session selected for another reason, but does not create a candidate by itself.

Historical OMP 18.2.3 dogfood over 136 sessions produced 85 candidates under the original all-non-coverage policy. Of those, 65 were selected only by `tool-error`, 19 combined tool errors with terminal-missing evidence, and 1 had terminal-missing alone. Treating tool errors as supporting evidence therefore reduces the same trace-only candidate set from 85/136 (62.5%) to 20/136 (14.7%) without dropping a terminal-missing session. This is a triage decision, not a claim that tool errors are unimportant.

The scan is intended for #31 dogfood over both new omp-kit sessions and older normal
OMP usage. It is not a quality score or a claim that sessions not selected as
candidates had no side effects.

## What is delivered

`omp-kit.session-assurance/v1` carries normalized action observations, per-source
coverage, optional observed-scope facts, rule execution results and generic
evidence-linked findings. The current default full-report profile enables five
built-in rules:

| Rule/finding | Meaning | Not a claim that |
| --- | --- | --- |
| `omp-kit.tool-error` / `tool-error` | A tool span explicitly reports an error; supporting evidence only | The entire task failed or no side effect occurred |
| `omp-kit.terminal-missing` / `terminal-missing` | Every available sample for an action lacks terminal evidence; supporting evidence only | A process is still running or certainly failed |
| `omp-kit.resolution-gap` / `resolution-gap` | Promotes a missing terminal into bounded review semantics, including a yielded task result with no observed parent delivery | The work is still executing, failed, or was unauthorized |
| `omp-kit.coverage-gap` / `coverage-gap` | A trace limit, unavailable/unassessed source, conflict or inherently unobserved surface | An unobserved effect did not occur |
| `omp-kit.scope-expansion` / `scope-expansion` | A later classified action on one track first reaches a previously unseen observed boundary | The action was unauthorized, risky, or semantically out of scope |

Tool-result return and background-job terminal are separate observations. Missing
`isError` is represented as `errorReported: false` (no flag observed), never as a
verified process result. A mixed terminal history is preserved as conflicting
observations, not silently promoted to recovered/successful or stale evidence. `tool-error` and raw `terminal-missing` findings are presented in the Evidence section rather than Attention. `resolution-gap` is the attention layer for missing closure: a normal missing background span remains `background-resolution-unobserved`; for the currently observed OMP async task-job contract, a child track that has a successful observed `yield` while the parent background span remains unterminated is reported as `task-result-undelivered`. OMP stats opens a background span on `async-running` and closes it only on parent `async-result` delivery, so child yield is not treated as parent resolution. Scope expansion remains a separate attention signal.

Observed scope is documented separately in [assurance-scope.md](assurance-scope.md).
It distinguishes `workspace`, `host-user`, `host-system`, `external`, and `unknown`
boundaries while keeping requested scope and authorized scope explicitly outside V1.
Generic shell/eval semantics are deliberately left unclassified rather than guessed.

## Rule system boundaries

The rule system follows the same broad separation used by mature lint/analyzer
systems: rule definitions are independent from execution, registration, enablement
and presentation. No rule DSL or dynamic filesystem discovery is introduced.

- `src/assurance/model.ts` defines normalized observations, optional derived fact
  surfaces, the generic rule metadata/local-finding contract, engine results and the
  report schema. Finding `kind` and `code` are strings owned by rules.
- `src/assurance/engine.ts` is the deterministic execution engine. It imports no
  concrete rule, registry, profile, reader or renderer. It validates definitions
  and outputs, clones/freezes inputs, isolates exceptions, assigns stable finding
  IDs/provenance, orders results and aggregates the report.
- `src/assurance/rules/` contains rule implementations. Each rule owns metadata,
  message IDs/text and a pure `evaluate(input)` function. Rules receive observations
  and derived facts only; they cannot obtain readers, shell callbacks, databases or
  mutable reports.
- `src/assurance/registry.ts` answers **which built-in rules exist**. Registry
  membership alone does not enable a rule.
- `src/assurance/profiles.ts` answers **which registered rules run**. The default
  profile is an explicit list of rule IDs.
- `src/assurance/render.ts` owns shared terminal layout/escaping. Rule labels and
  messages come from metadata rather than hard-coded rule IDs.
- `src/assurance/scan.ts` reduces many already-derived per-session reports into a
  bounded historical scan summary. It does not read OMP or own persistence.
- `scripts/session_assurance.ts` composes discovery/evidence acquisition, fact
  derivation, profiles, engine, scan summary and renderer.

Adding an ordinary built-in rule should require its rule module and tests plus
explicit registry/profile decisions. Shared semantics belong in normalized
observations/derived facts instead of a rule dependency DAG. Scope follows this
principle: classifiers derive reusable scope facts; `scope-expansion` only evaluates
those facts.

Rule states distinguish `evaluated`, `partial`, `skipped` and `failed`. Evaluated
means evaluated over the stated bounded scope, not exhaustive coverage. Engine
execution failure is represented as rule status/failure metadata, not fabricated as
a business finding from another rule. Exception text is discarded. An omitted rule
is not a zero-result rule. UI limits do not truncate JSON findings or evidence refs.

## Observation and fact composition

`src/assurance/trace-observations.ts` projects public OMP traces and validates the
fields it uses. A full report reads one explicit root trace and its returned tracks;
batch scan reads one root trace for each catalog-selected root session. Library callers
can combine multiple explicitly identified reads.

Tool observations from overlapping reads are correlated only by transcript identity
and native `toolCallId`. No matching by command text, timestamps or labels occurs.
Background spans and calls without native call IDs remain source-local conservatively;
they may appear more than once across overlapping inputs. Conflicts retain samples.

`src/assurance/scope/` is a separate derived-fact layer. Its IO adapter may retrieve
selected public OMP entries, but the classifiers themselves are pure and receive only
the structured tool call plus bounded path context. Classifier availability is
separate from assurance rule enablement.

## Evidence, privacy and coverage

Each full-report finding retains source/session/track/span and available entry/tool-call
references. The caller retains source-to-session-file mapping for OMP-native drill-down.
No new trace viewer is supplied. Absolute file/cwd paths, transcript titles, raw
arguments, outputs and trace `detail` previews are not copied into the report. Scope
enrichment uses raw tool arguments only transiently in memory. Tool labels, native
identifiers, timing, classifier identity and correlation hashes remain private
metadata; this is NOT an anonymized or automatically publishable format. #33 still
owns publication.

CLI reports and historical scans consume OMP's active-branch trace view. The interactive
`/assurance full` path additionally reads the current Main session's retained entries
through the public runtime API, so retained off-branch Main evidence can remain visible
after rewind. This is not erased-history recovery, and conversation rewind is not effect
rollback. Returned child tracks still do not prove exhaustive retained child coverage.
Detected source movement, cross-view mismatch, wrong views and invalid payloads are
unassessed, not empty successful histories.

Scope additionally records its own trace availability and per-tool classification
coverage. A valid empty trace is distinct from an unavailable trace, and an unsupported
tool is distinct from an action with no scope. The current limitations include generic
shell semantics, transitive tool effects, symlink targets, child absolute workspace
roots and cross-track causal ordering.

Model activity, arbitrary process/network effects and independent state verification
remain outside complete observation.

## Validation and next boundary

Tests use synthetic public traces and injectable readers, including missing and
conflicting observations, engine isolation, deterministic composition, registry/profile
separation, privacy projection, selected-entry scope recovery, explicit unclassified
actions, per-track scope expansion, batch catalog/filter behavior, pre-trace folder
pruning, zero-entry default scan, unsupported-tool prefiltering, full-scan diagnostics,
opaque-key drill-down, CLI exit behavior and no-IO help. Repository CI validates
the unmodified Bun/SDK suite. This is not acceptance in a user's installed OMP session.

Historical scanning has now been exercised over 136 normal OMP sessions. The first pass selected 85 sessions; real-data triage showed 65 were selected only by `tool-error`, so #47 preserved tool errors as Evidence while reducing same-sample candidates to 20. #48 then separated raw `terminal-missing` Evidence from `resolution-gap` Attention. The rerun split 145 resolution findings into 90 `background-resolution-unobserved` and 55 `task-result-undelivered` findings.

Event-level review of four small representative task/background candidates found that every sampled session predated OMP 18.2.2. Because 18.2.2/18.2.3 changed background/subagent settlement and retention semantics, that historical corpus remains useful compatibility evidence but should not be used to tune current Attention thresholds further. A fresh OMP 18.2.5 `shelf-go` session then exposed the first current-runtime lifecycle case: a long-running `CodeBoundaryScout` was explicitly cancelled by Main, so missing `async-result` alone was insufficient to call the job unresolved. That evidence justified the current-session `/assurance` and retained-tree `/assurance full` slice without broadening Attention policy.
The possible Agent-as-prover / Assurance-as-verifier direction remains an open design
hypothesis rather than an implemented protocol. Neither #31 nor #33 is complete.
This slice does not provision a database or upload sessions.
