# Session Evidence

omp-kit uses **OMP as the raw session/stat recorder** and derives compact local summaries for later analysis. This gives #5/#8/#9 a quantitative evidence base without adding a second journal parser, trace database, or model-visible logging step.

## Product model

```text
normal OMP session
  -> OMP session store + stats ingestion        # raw authority
  -> omp-kit evidence collect                   # incremental derived summary
  -> local session-evidence store               # compact, outside Git
  -> aggregate report                           # inspect/filter later
  -> selected material evidence                 # optionally promote through #12
```

Raw collection is already automatic because OMP persists normal sessions. The omp-kit collector can run later and reconstruct any new or changed session from OMP's public stats/session surfaces. Users do **not** need to remember to log every session or add a reflection turn before exit.

## Commands

From the repository/package:

```bash
bun run evidence:collect
bun run evidence:report
```

The packaged CLI exposes the same interface:

```bash
omp-kit-evidence collect
omp-kit-evidence report
```

Useful filters:

```bash
bun run evidence:collect -- --folder /path/to/project --since 2026-09-01T00:00:00Z
bun run evidence:report  -- --folder /path/to/project --since 2026-09-01T00:00:00Z
bun run evidence:report  -- --json
```

`--folder` accepts the normal project filesystem path or a substring. Matching uses the public session trace `cwd` when available and also accepts OMP's `/api/sessions.folder` value as a fallback. This matters on released OMP versions where stats can expose a session-storage key such as `-project-omp-kit` while the corresponding trace correctly reports `/home/user/project/omp-kit`. omp-kit does not reproduce that storage-key encoding locally.

`collect` first asks OMP stats to synchronize its ordinary session data, discovers root sessions, and only rebuilds a derived summary when its compact revision changed. Re-running it over unchanged sessions is idempotent. Summaries created by the pre-fix v1 candidate without explicit `cwd` provenance are refreshed once so later reports can use normal filesystem-path filters reliably.

## Storage

Default derived-data root:

```text
${PI_CODING_AGENT_DIR or OMP agent dir}/omp-kit/session-evidence/
  index.json
  sessions/
    <sha256-of-root-session-file>.json
```

Set `OMP_KIT_EVIDENCE_DIR` or pass `--root` to use another local derived-data directory.

This store is intentionally outside Git. It contains compact summaries, not copied transcripts or full trace payloads.

## Summary schema

Current schema:

```text
omp-kit.session-evidence/v1
```

Each root-session summary retains, where OMP exposes the information reliably:

- root session/project/cwd/title/time bounds;
- request, token, cost-equivalent and unpriced-request totals;
- wall/model/tool/idle timing;
- main/subagent/advisor track counts and request counts;
- model calls, tokens, cost and sampled provider identity;
- per-tool calls/errors/durations;
- subagent envelope activity and coarse overlap;
- structured `omp_kit_feedback` record ids/categories/severities linked from every track in the root trace.

The user-facing `session.folder` value prefers the public trace `cwd` and falls back to the summary folder only when OMP does not expose a cwd. The explicit `session.cwd` field preserves whether the trace provided that filesystem-path provenance.

Provider identity is not duplicated from raw journals. OMP trace does not include it directly, so the v1 collector selectively reads one public `/api/session/entry` sample per `(track, model)` when needed. If provider provenance cannot be recovered through that public surface, it stays `null` rather than being guessed. This is deliberately **sampled provenance**, not an exact provider-routing ledger: if one track uses the same model id through multiple providers, v1 may attribute those same-model calls to the sampled provider. Request/model/token counts remain independent of that sampled label. Do not use v1 summaries to make a provider-fallback decision that requires exact per-request attribution.

Subagent overlap is deliberately named **envelope overlap**: it measures simultaneous child-track activity envelopes and is a coordination signal, not a claim about CPU/GPU concurrency.

## OMP interfaces

The collector uses the released/public OMP stats package/server:

```text
@oh-my-pi/omp-stats
  startServer()

/api/sync
/api/sessions
/api/session/trace
/api/session/entry     # selective provider provenance only
```

Do not replace these with direct `stats.db` queries or raw OMP JSONL parsing.

## Shared reads and coverage

`src/session/omp-access.ts` is the shared local access layer for the collector and future assurance consumers. It contains no scoring, command classification, database storage or UI:

- `createOmpStatsClient` constructs an inert client for a caller-selected loopback HTTP origin; `sync`, `listSessions`, `getTrace` and `getEntry` are explicit operations. Redirects are rejected.
- `withOmpStats` creates and closes its own OMP stats server, including on failure. Importing the module does not start a server or synchronize sessions.
- `readCurrentSession` uses the public read-only session manager's `getBranch` or `getEntries`. It returns a detached snapshot of one session's current branch or retained entries, not a second journal or recursive child reader.

A read returns `available`, `partial` or `unavailable`, its scope, a read-time window and limitations. An empty successful payload remains data; a failed read has a structured problem and **no data field**. Availability says nothing about tool success or the absence of external effects. Callers retain the requested session/track identity when associating results. Diagnostics intentionally omit request paths, server bodies and raw exception text.

Session lists are bounded views of the selected stats/profile store, not a complete filesystem inventory. Reaching the requested limit adds an explicit limit marker; falling below it does not prove all sessions were included.

On OMP 18.2.0, stats traces describe persisted active branches. Rewinding a conversation may remove an earlier action from that view without undoing its effects. Trace reads therefore always expose active-branch, unknown child-completeness, preview-detail and non-atomic-snapshot limits. A successful root trace does not prove every child was readable. A caller that separately fails to read a child must retain that failure rather than substituting an empty track.

Current-session `retained-entries` reads include entries outside the active branch that OMP still retains. They do not recover deleted history or certify child/process/network coverage. Session identity and leaf are checked before and after the read; a detected change is unavailable, not silently retried. Raw entries, preview strings and local file references remain **private**, not sanitized or approved for publication under #33.

The existing collector deliberately unwraps these bounded reads through `requireRead`: its v1 schema, filters, sampled provider labels, feedback joins, incremental cache and human/JSON output remain unchanged. Sync/list/trace failures still abort collection; provider-entry failures still leave sampled provider identity `null`. Malformed API data now fails at the access boundary instead of reaching the summarizer. Review consumers must retain coverage metadata rather than treating quantitative summaries as exhaustive assurance.

Contract sources: OMP 18.2.0 [trace assembly](https://github.com/can1357/oh-my-pi/blob/v18.2.0/packages/stats/src/trace.ts), [trace types](https://github.com/can1357/oh-my-pi/blob/v18.2.0/packages/stats/src/shared-types.ts), and [public session manager](https://github.com/can1357/oh-my-pi/blob/v18.2.0/packages/coding-agent/src/session/session-manager.ts). Mocked boundary tests do not replace installed-runtime acceptance; no new live OMP acceptance is claimed by this refactor.

## Feedback relationship

`omp_kit_feedback` is the qualitative evidence stream. Its records remain durable in the feedback store and session journal. The evidence collector links feedback by the public session-file provenance stored in each feedback record.

A root session can contain Main and child transcripts, so the collector joins feedback from **all trace tracks**, not only the root session file. This lets worker feedback appear in the same root-session evidence used for delegation/tool analysis.

Counters do not decide whether a workflow was good. Feedback does not authorize a change. #5/#8/#9 combine quantitative summaries, qualitative evidence, task acceptance, and human judgment when a real decision is needed.

## Routine observation vs experiment evidence

Routine session summaries are cheap observations and remain outside Git.

When a set of sessions materially supports a durable project decision, select the relevant summaries/raw identities and promote the decision through `docs/experiments.md` / `evidence/experiments/`. Do not freeze every normal session as an experiment.

## Privacy and scope

The collector is local-only. It does not upload telemetry, contact a cloud service, or copy full conversation text into its derived store. Session file paths, project paths, model/tool metadata, usage/cost-equivalent values, and feedback identifiers are still potentially sensitive local metadata and should be treated accordingly.

## Current limitations

- Quality/acceptance is not inferred automatically from token or timing counters.
- Provider identity is sampled per `(track, model)`, not an exact per-request routing ledger; same-model provider switching may be conflated.
- Provider sampling depends on the public session-entry payload; unavailable values remain unknown.
- The collector summarizes the sessions visible to the current OMP stats/profile store; cross-machine aggregation is not part of v1.
- Remote replication belongs to #12 only after a real backend is chosen.
