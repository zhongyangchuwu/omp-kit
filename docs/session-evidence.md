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

For `--json`, stdout is reserved for the JSON document; local OMP stats startup progress is routed to stderr.

`--folder` accepts the normal project filesystem path or a substring. On the pinned OMP 18.2.3 baseline, `SessionSummary.folder` is the real working directory, so collection filters catalog summaries before reading traces. Stored v1 summaries still retain `session.cwd`, and report filtering accepts either field so evidence created around the pre-18.2.1 folder bug remains usable. The old trace-`cwd` prefilter workaround is not part of current collection.

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

The shared [session access library](session-access.md) separates these reads from server ownership and preserves explicit availability/scope for future assurance and publication consumers. Existing collector schemas and storage remain unchanged.

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
- Generic remote replication/publication for routine session-derived data belongs to #33. #12 owns retention/replication decisions for selected material experiment artifacts, not the general SessionEvidence pipeline.
