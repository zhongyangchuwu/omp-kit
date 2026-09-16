# Session assurance: initial report

This is the first usable report slice of #31, built on the shared
[session access](session-access.md) layer. It is an evidence snapshot, not a
security audit, task-completion certificate or permission decision.

## Run locally

```bash
bun run assurance:report -- --session /absolute/path/to/session.jsonl
bun run assurance:report -- --session /absolute/path/to/session.jsonl --json
omp-kit-assurance --session /absolute/path/to/session.jsonl
```

The session file must belong to the selected OMP profile's supported session store.
It is an identifier passed to public OMP stats/session APIs, not a file parsed by
omp-kit. An already running local server can be selected with
`--origin http://127.0.0.1:3847`. Otherwise the command temporarily owns a local
OMP stats server and releases it afterwards. Native server startup may update OMP's
local stats.

The command reads one explicit active-branch trace. For observed-scope enrichment it
may also fetch selected entries by native entry id and follow a bounded parent chain
to recover the matching structured tool call in memory. Raw arguments and paths are
not copied into the report. It does not explicitly sync or scan the session catalog,
run checks, invoke models or publish data. Requests share a 15-second abort signal;
server startup/cleanup is still controlled by OMP.

Exit 0 means the selected report was produced, including when tool errors or scope
findings exist. Exit 2 indicates invalid usage, a trace read that could not be
assessed, or rule failure. Neither exit code is a safety verdict. Failed trace reads
still produce coverage information; startup/usage errors produce a bounded generic
diagnostic. `--help` performs no profile or stats access. The command is inert until
invoked; no extension or default background job is added by this slice.

## What is delivered

`omp-kit.session-assurance/v1` carries normalized action observations, per-source
coverage, optional observed-scope facts, rule execution results and generic
evidence-linked findings. The current default profile enables four built-in rules:

| Rule/finding | Meaning | Not a claim that |
| --- | --- | --- |
| `omp-kit.tool-error` / `tool-error` | A tool span explicitly reports an error | The entire task failed or no side effect occurred |
| `omp-kit.terminal-missing` / `terminal-missing` | Every available sample for an action marks its terminal missing | A process is still running or certainly failed |
| `omp-kit.coverage-gap` / `coverage-gap` | A trace limit, unavailable/unassessed source, conflict or inherently unobserved surface | An unobserved effect did not occur |
| `omp-kit.scope-expansion` / `scope-expansion` | A later classified action on one track first reaches a previously unseen observed boundary | The action was unauthorized, risky, or semantically out of scope |

Tool-result return and background-job terminal are separate observations. Missing
`isError` is represented as `errorReported: false` (no flag observed), never as a
verified process result. A mixed terminal history is preserved as conflicting
observations, not silently promoted to recovered/successful or stale evidence.

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
- `scripts/session_assurance.ts` composes evidence acquisition, fact derivation, the
  built-in registry/default profile, generic engine and renderer.

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
fields it uses. The CLI reads one explicit root trace and its returned tracks;
library callers can combine multiple explicitly identified reads.

Tool observations from overlapping reads are correlated only by transcript identity
and native `toolCallId`. No matching by command text, timestamps or labels occurs.
Background spans and calls without native call IDs remain source-local conservatively;
they may appear more than once across overlapping inputs. Conflicts retain samples.

`src/assurance/scope/` is a separate derived-fact layer. Its IO adapter may retrieve
selected public OMP entries, but the classifiers themselves are pure and receive only
the structured tool call plus bounded path context. Classifier availability is
separate from assurance rule enablement.

## Evidence, privacy and coverage

Each finding retains source/session/track/span and available entry/tool-call references.
The caller retains source-to-session-file mapping for OMP-native drill-down. No new
trace viewer is supplied. Absolute file/cwd paths, transcript titles, raw arguments,
outputs and trace `detail` previews are not copied into this report. Scope enrichment
uses raw tool arguments only transiently in memory. Tool labels, native identifiers,
timing, classifier identity and correlation hashes remain private metadata; this is
NOT an anonymized or automatically publishable format. #33 still owns publication.

Trace rules currently consume OMP's active-branch view. Even if the access library
can read retained entries, this CLI does NOT inspect all retained branches or claim
to cover actions lost from the active conversation branch. Conversation rewind is
not effect rollback. Returned child tracks do not prove exhaustive child coverage.
Detected source movement, wrong views and invalid payloads are unassessed, not empty
successful histories.

Scope additionally records its own trace availability and per-tool classification
coverage. A valid empty trace is distinct from an unavailable trace, and an
unsupported tool is distinct from an action with no scope. The current limitations
include generic shell semantics, transitive tool effects, symlink targets, child
absolute workspace roots and cross-track causal ordering.

Model activity, arbitrary process/network effects and independent state verification
remain outside complete observation.

## Validation and next boundary

Tests use synthetic public traces and injectable readers, including missing and
conflicting observations, engine isolation, deterministic composition, registry/profile
separation, privacy projection, selected-entry scope recovery, explicit unclassified
actions, per-track scope expansion, CLI exit behavior and no-IO help. Repository CI
validates the unmodified Bun/SDK suite. This is not acceptance in a user's installed
OMP session.

Still required by #31: opt-in `/assurance` integration, live-session/rewind/child-read
dogfood, broader useful evidence semantics and claim-specific verification. The
possible Agent-as-prover / Assurance-as-verifier direction remains an open design
hypothesis rather than an implemented protocol. Neither #31 nor #33 is complete.
This slice does not provision a database or upload sessions.
