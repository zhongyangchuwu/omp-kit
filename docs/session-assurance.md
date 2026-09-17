# Session assurance: initial report

This is the first usable report slice of #31, built on the shared
[session access](session-access.md) layer. It is an evidence snapshot, not a
security audit, task-completion certificate or permission decision.

## Run locally

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
entry reads. On OMP 18.2.3, built-in full scans first use the trace tool label as a
conservative prefilter: tool names that no built-in Scope V1 classifier supports are
recorded as `unsupported-tool` without selected-entry recovery. Supported tool names
still recover structured arguments before classification.

The default scan therefore performs a cheap first pass:

```text
sync + bounded session list
-> matching active-branch trace per session
-> tool-error / terminal-missing / coverage-conflict rules
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
evidence-linked findings. The current default full-report profile enables four
built-in rules:

| Rule/finding | Meaning | Not a claim that |
| --- | --- | --- |
| `omp-kit.tool-error` / `tool-error` | A tool span explicitly reports an error | The entire task failed or no side effect occurred |
| `omp-kit.terminal-missing` / `terminal-missing` | Every available sample for an action marks its terminal missing | A process is still running or certainly failed |
| `omp-kit.coverage-gap` / `coverage-gap` | A trace limit, unavailable/unassessed source, conflict or inherently unobserved surface | An unobserved effect did not occur |
| `omp-kit.scope-expansion` / `scope-expansion` | A later classified action on one track first reaches a previously unseen observed boundary | The action was unauthorized, risky, or semantically out of scope |

Tool-result return and background-job terminal are separate observations. Missing
`isError` is represented as `errorReported: false` (no flag observed), never as a
verified process result. A mixed terminal history is preserved as conflicting
observations, not silently promoted to recovered/successful or stale evidence. `tool-error` is presented in the Evidence section rather than Attention: it records an observed failure signal, while terminal gaps and scope expansion remain current attention triggers. A future post-failure consequence rule should be derived from ordered session evidence rather than treating every tool error as equivalent.

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

Trace rules currently consume OMP's active-branch view. Even when the catalog contains
older normal sessions, assurance does NOT inspect erased branches or claim to cover
actions lost from the active conversation branch. Conversation rewind is not effect
rollback. Returned child tracks do not prove exhaustive child coverage. Detected
source movement, wrong views and invalid payloads are unassessed, not empty successful
histories.

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

Historical scanning has now been exercised over 136 normal OMP sessions and used to reduce tool-error triage noise. Still required by #31: inspect representative attention candidates and non-candidates, exercise rewind/child-read behavior, and use ordered real-session evidence to decide whether a post-failure recovery/consequence slice materially helps human review. The opt-in `/assurance` UI
remains deferred until the report proves useful enough to justify product integration.
The possible Agent-as-prover / Assurance-as-verifier direction remains an open design
hypothesis rather than an implemented protocol. Neither #31 nor #33 is complete.
This slice does not provision a database or upload sessions.
