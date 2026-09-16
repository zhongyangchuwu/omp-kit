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
It is an identifier passed to the public trace API, not a file parsed by omp-kit.
An already running local server can be selected with
`--origin http://127.0.0.1:3847`. Otherwise the command temporarily owns a local
OMP stats server and releases it afterwards. Native server startup may update OMP's
local stats. The report does not explicitly sync, scan the session catalog, fetch
entries, run checks, invoke models or publish data. Trace requests have a 15-second
abort signal; server startup/cleanup is still controlled by OMP.

Exit 0 means the selected report was produced, including when tool errors exist.
Exit 2 indicates invalid usage, a read that could not be assessed, or rule failure.
Neither exit code is a safety verdict. Failed trace reads still produce a report
with a coverage gap; startup/usage errors produce a bounded generic diagnostic.
`--help` performs no profile or stats access. The command is inert until invoked;
no extension or default background job is added by this slice.

## What is delivered

`omp-kit.session-assurance/v1` carries normalized action observations, per-source
coverage, rule execution results and generic evidence-linked findings. The current
default profile enables three built-in rules:

| Rule/finding | Meaning | Not a claim that |
| --- | --- | --- |
| `omp-kit.tool-error` / `tool-error` | A tool span explicitly reports an error | The entire task failed or no side effect occurred |
| `omp-kit.terminal-missing` / `terminal-missing` | Every available sample for an action marks its terminal missing | A process is still running or certainly failed |
| `omp-kit.coverage-gap` / `coverage-gap` | A scope limit, unavailable/unassessed source, conflict or inherently unobserved surface | An unobserved effect did not occur |

Tool-result return and background-job terminal are separate observations. Missing
`isError` is represented as `errorReported: false` (no flag observed), never as a
verified process result. A mixed terminal history is preserved as conflicting
observations, not silently promoted to recovered/successful or stale evidence.
Checks, git operations and command intent are not classified in this slice.

## Rule system boundaries

The rule system follows the same broad separation used by mature lint/analyzer
systems: rule definitions are independent from execution, registration, enablement
and presentation. No rule DSL or dynamic filesystem discovery is introduced.

- `src/assurance/model.ts` defines normalized observations, the generic rule metadata
  and local-finding contract, engine results and the report schema. Finding `kind`
  and `code` are strings owned by rules; adding a normal rule does not extend a
  central enum or database-shaped union.
- `src/assurance/engine.ts` is the deterministic execution engine. It imports no
  concrete rule, registry, profile, reader or renderer. It validates definitions
  and outputs, clones/freezes inputs, isolates exceptions, assigns stable finding
  IDs/provenance, orders results and aggregates the report.
- `src/assurance/rules/` contains rule implementations. Each rule owns metadata,
  message IDs/text and a pure `evaluate(input)` function. Rules receive observations
  only; they cannot obtain readers, shell callbacks, databases or mutable reports.
- `src/assurance/registry.ts` answers **which built-in rules exist**. Registry
  membership alone does not enable a rule.
- `src/assurance/profiles.ts` answers **which registered rules run**. The default
  profile is an explicit list of rule IDs, so experimental rules can be registered
  without becoming default policy.
- `src/assurance/render.ts` owns shared terminal layout/escaping. Rule labels and
  messages come from metadata rather than hard-coded rule IDs. Unknown metadata has
  a bounded fallback rather than causing renderer failure.
- `scripts/session_assurance.ts` composes the built-in registry, default profile,
  generic engine and renderer, while owning selection, IO and process exit behavior.

Adding an ordinary built-in rule should require its rule module and tests plus
explicit registry/profile decisions. It should not require changes to the generic
engine, report schema or renderer. Rules should not depend on other rules' outputs;
shared semantics belong in normalized observations/derived facts instead of a rule DAG.

Rule states distinguish `evaluated`, `partial` (some supplied sources unassessed),
`skipped` (no usable action source) and `failed`. Evaluated means evaluated over the
stated bounded scope, not exhaustive coverage. Engine execution failure is represented
as rule status/failure metadata, not fabricated as a business finding from another
rule. Exception text is discarded. An omitted rule is not a zero-result rule.
UI limits do not truncate JSON findings or their evidence references.

Rule metadata includes stable identity/version, human title/description, message
catalog and a small presentation hint. Rules return local findings (`kind`, `code`,
subject and evidence); the engine attaches rule identity/version and stable global
finding IDs. This is analogous to diagnostic producers emitting stable codes while
the presentation layer remains generic.

## Observation composition

`src/assurance/trace-observations.ts` projects public OMP traces and validates the
fields it uses. The CLI reads one explicit root trace and its returned tracks;
library callers can combine multiple explicitly identified reads. A future retained-
entry adapter can produce the same normalized input without changing the rule engine.

Tool observations from overlapping reads are correlated only by transcript identity
and native `toolCallId`. No matching by command text, timestamps or labels occurs.
Background spans and calls without native call IDs remain source-local conservatively;
they may appear more than once across overlapping inputs. Conflicts retain samples.
Replaying the same observations and rule set yields stable finding IDs and ordering;
changing read metadata changes the snapshot.

## Evidence, privacy and coverage

Each finding retains source/session/track/span and available entry/tool-call references.
The caller retains source-to-session-file mapping for OMP-native drill-down. No new
trace viewer is supplied. Absolute file/cwd paths, transcript titles, raw arguments,
outputs and trace `detail` previews are not copied into this report. Tool labels,
native identifiers, timing and correlation hashes remain private metadata; this is
NOT an anonymized or automatically publishable format. #33 still owns publication.
Terminal controls in displayed references are escaped and identifiers are bounded.

Trace rules currently consume OMP's active-branch view. Even if the access library
can read retained entries, this CLI does NOT inspect them or claim to cover actions
lost from the active conversation branch. Conversation rewind is not effect rollback.
Returned child tracks do not prove exhaustive child coverage. Detected source movement,
wrong views and invalid payloads are unassessed, not empty successful histories.
Model activity, arbitrary process/network effects and independent state verification
remain outside these initial rules.

## Validation and next boundary

Tests use synthetic public traces and injectable readers, including missing and
conflicting observations, engine isolation, deterministic composition, registry/profile
separation, privacy projection, CLI exit behavior and no-IO help. A contract test adds
a fourth ordinary rule through the public Rule API and generic renderer without
changing either implementation. Repository CI validates the unmodified Bun/SDK suite.
This is not acceptance in a user's installed OMP session.

Still required by #31: opt-in `/assurance` integration, live-session/rewind/child-read
dogfood, additional useful classifications and claim-specific verification. Neither
#31 nor #33 is complete. This slice does not provision a database or upload sessions.
