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
coverage, rule execution results and three finding categories:

| Finding | Meaning | Not a claim that |
| --- | --- | --- |
| `tool-error` | A tool span explicitly reports an error | The entire task failed or no side effect occurred |
| `terminal-missing` | Every available sample for this action marks its terminal missing | A process is still running or certainly failed |
| `coverage-gap` | A scope limit, unavailable/unassessed source, conflicting observation or failed rule | An unobserved effect did not occur |

Tool-result return and background-job terminal are separate observations. Missing
`isError` is represented as `errorReported: false` (no flag observed), never as a
verified process result. A mixed terminal history is preserved as conflicting
observations, not silently promoted to recovered/successful or stale evidence.
Checks, git operations and command intent are not classified in this slice.

## Composition

- `src/assurance/trace-observations.ts` projects public OMP traces and validates
  the fields it uses. The CLI reads one explicit root trace and its returned tracks;
  library callers can combine multiple explicitly identified reads.
- `model.ts` defines the small data contract independently of an OMP client or CLI.
  A future retained-entry adapter can produce observations without rewriting rules.
- `rules.ts` exports independent, versioned rules. Each consumes only observations
  and coverage, not readers or execution callbacks. Custom rules are trusted local
  code, not sandboxed extensions. No rule DSL or registry service is introduced.
- `report.ts` composes an explicit rule list and renders bounded text. Input is
  detached and deeply frozen before rules run. One rule cannot mutate another's
  observations; a throwing/malformed rule produces a gap without its exception text.
- `scripts/session_assurance.ts` owns selection, IO and process exit behavior.

Rule states distinguish `evaluated`, `partial` (some supplied sources unassessed),
`skipped` (no usable action source) and `failed`. Evaluated means evaluated over the
stated bounded scope, not exhaustive coverage. An omitted rule is not a zero-result
rule. UI limits do not truncate the JSON findings or their evidence references.

Tool observations from overlapping reads are correlated only by transcript identity
and native `toolCallId`. No matching by command text, timestamps or labels occurs.
Background spans and calls without native call IDs remain source-local conservatively;
they may appear more than once across overlapping inputs. Conflicts retain samples.
Finding IDs include rule identity/version and subject. Replaying the same input and
rule set yields stable IDs and ordering; changing read metadata changes the snapshot.

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
conflicting observations, isolation, deterministic composition, privacy projection,
CLI exit behavior and no-IO help. The repository CI validates the unmodified Bun/SDK
suite. This is not acceptance in a user's installed OMP session.

Still required by #31: opt-in `/assurance` integration, live-session/rewind/child-read
dogfood, additional useful classifications and claim-specific verification. Neither
#31 nor #33 is complete. This slice does not provision a database or upload sessions.
