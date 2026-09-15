# Composable session evidence access

`src/session/` is the shared reading boundary for #31 and future #33 consumers.
It exposes OMP evidence, not a second recorder or an assurance verdict. The
quantitative collector, assurance rules and publication remain separate consumers.
The overlapping candidates #34 and #35 are consolidated into this implementation;
there is no parallel `omp-access.ts` client.

## Composition boundaries

- `omp-stats.ts`: public local stats access, with narrow `SessionTraceReader` and
  `SessionEntryReader` interfaces. Callers need not own the server or import a CLI.
- `omp-stats-contract.ts`: validation of consumed public fields. It retains additive
  fields, but rejects malformed known fields rather than blindly casting JSON.
- `read-result.ts`: common availability, scope/limitations and consistency metadata.
- `runtime-entries.ts`: detached snapshots through public sessionManager reads.
- `src/evidence/session-evidence.ts`: existing quantitative types and derivation;
  the CLI keeps compatibility exports, arguments, persistence and report rendering.

Importing these libraries or constructing a client does not start a server, sync,
load a private profile or invoke a model. `withLocalOmpStats` starts and owns one
server when called and stops that server in `finally`. Borrowed clients do not
close someone else's server. Transport, startup and clocks are injectable.
OMP's own startup/sync effects remain runtime-owned, not an extra recorder here.

The stats client accepts only loopback HTTP origins without credentials, paths,
queries or fragments. Requests reject redirects. Remote publication is not a reason
to forward raw local session paths to arbitrary HTTP servers; #33 owns that boundary.
Reads support cancellation and do not add retries, implicit sync or background work.

## Three independent questions

| Dimension | Meaning |
| --- | --- |
| `status: available / unavailable` | Was the requested view obtained and its consumed public shape validated? |
| `scope` and `limitations` | What does that view cover, and what does it not establish? |
| `consistency` | Was source movement checked, not detected by those checks, or detected? |

A successful bounded trace is **available**, even though it only describes active
branches. It is not globally complete. Do not use `partial` for both a bounded view
and a read that moved. Those incompatible candidate meanings are deliberately removed.

An empty successful result is data. An unavailable read has a safe failure reason
and no data field. `requireEvidence` rejects unavailable results and detected source
movement. It accepts an available bounded view, but does not establish exhaustive
coverage or atomicity. Report consumers must retain metadata rather than unwrapping
away their limitations. Callers retain their selected session/track identity when
composing reads, especially failures whose diagnostics intentionally omit paths.

Every read records a start/finish window. HTTP reads use `consistency: not-checked`
and never claim an atomic cross-track snapshot. Runtime snapshots check session id,
file and leaf before/after reading. If the session identity changes, potentially
mixed data is discarded. If only the leaf changes, the detached data remains an
available observation with `consistency: source-changed`; strict consumers reject it.
`no-change-detected` means only those checks passed, not that all concurrent changes
or changes that returned to the same identity were excluded.

## Scope of each view

| View | Boundary |
| --- | --- |
| `session-list` | Bounded catalog of the selected stats/profile store; reaching the limit is marked, falling below it does not prove exhaustive discovery |
| `active-branch-trace` | Persisted active branches and returned child tracks; child completeness is unknown, details are previews, reads are non-atomic |
| `selected-entry` | One public entry, checked against the requested entry id; successful contents remain private |
| `active-branch-entries` | One live session's selected branch; an empty leaf returns an empty branch without passing null to the SDK |
| `all-retained-entries` | One live session's retained entries, including off-branch entries; not erased history or other/child sessions |

OMP 18.2.0 sources: [trace assembly](https://github.com/can1357/oh-my-pi/blob/v18.2.0/packages/stats/src/trace.ts),
[public trace types](https://github.com/can1357/oh-my-pi/blob/v18.2.0/packages/stats/src/shared-types.ts),
and [sessionManager reads](https://github.com/can1357/oh-my-pi/blob/v18.2.0/packages/coding-agent/src/session/session-manager.ts).
Conversation rewind does not establish that an earlier external effect was undone.
A returned root trace does not prove every child was readable. Separately observed
child-read failures must remain failures, never empty successful tracks.

## Extending without another framework

Keep IO and source-specific validation at the reading boundary. Add interpretation
as separately testable functions, without hidden IO, mutable shared rule state or
a second session store. Future rules should declare the observations they need;
a skipped rule must not be confused with a completed rule that found nothing.
Neither presentation nor publication belongs in the readers. Reuse native OMP types
instead of inventing a parallel raw journal schema.

A missing error flag is not verified success. A missing terminal record does not
prove a process is still running. Async tool return is not job completion. Truncated
detail text is not a full command. This slice performs none of those interpretations.

## Privacy and validation boundary

Raw successes can contain paths, commands, transcript text and private metadata.
They are not an allowlisted publication format; #33 still needs an explicit publish
projection. Neither short summaries nor hashes automatically anonymize information.
Read failures omit request paths, response bodies and raw transport/runtime exception
text. This library does not persist raw payloads.

The quantitative CLI retains v1 schema/storage/revision/filter/provider-sampling
behavior. Required sync/catalog/trace failures stop collection. Optional provider
lookup failures remain unknown. The extracted derivation bodies are not changed by
this consolidation; returned malformed API data is rejected at the reading boundary.

Tests exercise synthetic transport, runtime snapshots and direct library composition.
A compile-time check also passes the published SDK's ReadonlySessionManager to the
adapter, rather than relying only on permissive fakes. CI checks the full repository
and Bun contracts. Neither these tests nor SDK compilation establish live rewind,
child-coverage or installed-profile acceptance. No assurance rules/UI, PostgreSQL or
cloud publication is delivered here. #31 and #33 remain open.
