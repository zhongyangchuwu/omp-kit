# Composable session evidence access

The shared reads under `src/session/` are the first implementation slice of #31.
They expose existing OMP evidence, not a second recorder, a generic plugin engine,
or an assurance verdict. Quantitative evidence, future assurance rules and future
#33 publication may consume the reads independently; none must invoke another CLI.

## Boundaries

- `omp-stats.ts`: public stats HTTP access. `SessionTraceReader` and
  `SessionEntryReader` let a consumer request only the capability it needs.
- `read-result.ts`: requested view plus available / partial / unavailable results.
  Strict consumers use `requireEvidence`; report builders retain each failed read
  as a coverage gap rather than replacing it with an empty array.
- `src/evidence/session-evidence.ts`: existing evidence types and derivation, with no
  filesystem, CLI or server lifecycle dependency. The CLI re-exports its old surface.
- `runtime-entries.ts`: detached snapshots through the public sessionManager's
  `getBranch` / `getEntries` methods. It neither parses JSONL nor opens a database.

`createOmpStatsClient` borrows an explicit server and performs no IO at construction.
`withLocalOmpStats` lazily starts and owns one local server, releasing it even when
its consumer fails. Callers can inject transport/start functions for provider-free
contract tests. Reads accept caller cancellation. The client adds no implicit sync
request, retry loop, daemon, model call, or automatic remote verification. Native
server-startup effects remain OMP-owned.

## What the views mean

An available read means the requested view was obtained, not that all historical
execution or real-world effects were observed.

| View | Boundary |
| --- | --- |
| `session-list` | The requested, bounded stats catalog result, not all possible sessions |
| `active-branch-trace` | OMP's trace view and returned child tracks; not every retained branch or every child |
| `selected-entry` | One requested public entry; raw private content, not sanitized output |
| `active-branch-entries` | One live session's selected branch |
| `all-retained-entries` | One live session's retained entries, including off-branch entries; not erased history or child sessions |

The runtime snapshot records session identity and leaf, detaches the returned entries,
and marks a detected identity/leaf change as partial. This is not a cross-track atomic
snapshot protocol. Historical-session discovery, missing-child detection and complete
cross-session coverage remain separate questions; do not infer them from these reads.

OMP 18.2.0 source contracts: [trace assembly](https://github.com/can1357/oh-my-pi/blob/v18.2.0/packages/stats/src/trace.ts),
[public trace types](https://github.com/can1357/oh-my-pi/blob/v18.2.0/packages/stats/src/shared-types.ts),
and [sessionManager reads](https://github.com/can1357/oh-my-pi/blob/v18.2.0/packages/coding-agent/src/session/session-manager.ts).
Conversation rewind does not establish that an earlier external effect was undone.

## Extension and composition rules

Add source-specific behavior at the reading boundary. Keep deterministic derivation
free of network, filesystem and server lifecycle responsibilities. Compose independent
reads explicitly; do not discard failed components when producing a partial report.
Future rules should declare their required observations and return evidence-linked
findings, not mutate other rules' output or silently fetch more private data.

Keep native OMP payload types at the access boundary rather than cloning the whole
upstream schema. The HTTP client checks response envelopes; semantic consumers must
validate the fields they interpret. A missing `isError` is not a verified success,
`unterminated` is not proof of a still-running process, and a truncated `detail` is not
a complete command. This slice does not implement action classification or verification.

## Privacy and compatibility

Successful reads can contain paths, commands, transcript text and other private data.
They are local inputs, not a publishable format. #33 still owns explicit allowlisted
publication; neither a short report nor a hash automatically makes data anonymous.
HTTP error bodies and raw transport/runtime exception messages are omitted from read
diagnostics. There is no raw-payload persistence in this access library.

The existing evidence CLI uses the shared stats client while retaining its commands,
summary schemas, local storage, revision behavior, folder matching and sampled-provider
semantics. Required catalog/trace failures still stop collection; optional provider
read failure still leaves provider unknown. Error messages are intentionally sanitized.
The existing derivation functions move unchanged to a directly importable library.
The CLI re-exports them for compatibility and retains local storage/argument handling.

Tests use synthetic responses and public-method fakes. CI establishes repository/type
and deterministic contract behavior, not live installed-runtime or private-profile
acceptance. `/assurance`, native feature wiring, semantic rules, PostgreSQL and cloud
publication are not delivered by this slice. Issue #31 remains open.
