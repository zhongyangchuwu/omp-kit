# Session Evidence

OMP Kit uses **OMP as the raw session/stat recorder** and derives compact local summaries for later analysis. This gives #5/#8/#9 quantitative evidence without adding a second journal parser, trace database or model-visible logging turn.

## Product model

```text
normal OMP session
  -> OMP session store + stats ingestion        # raw authority
  -> omp-kit evidence collect                   # incremental derived summary
  -> local session-evidence store               # compact, outside Git
  -> aggregate report                           # inspect/filter later
  -> current Issue/PR/doc decision when material
```

Users do not need to add a logging/reflection step to ordinary sessions. The collector can run later and summarize new or changed saved sessions from OMP public stats/session surfaces.

## Commands

```sh
bun run evidence:collect
bun run evidence:report
```

The packaged CLI exposes the same interface:

```sh
omp-kit-evidence collect
omp-kit-evidence report
```

Useful filters:

```sh
bun run evidence:collect -- --folder /path/to/project --since 2026-09-01T00:00:00Z
bun run evidence:report  -- --folder /path/to/project --since 2026-09-01T00:00:00Z
bun run evidence:report  -- --json
```

`--folder` accepts a normal project filesystem path or substring. Matching prefers public session-trace `cwd` and accepts `/api/sessions.folder` only as fallback metadata. This avoids reproducing OMP's non-reversible session-storage key encoding.

`collect` asks OMP stats to synchronize ordinary session data, discovers root sessions and rebuilds a summary only when its compact revision changes. Re-running over unchanged completed sessions is idempotent; an active session may legitimately rebuild as it changes.

## Storage

Default derived-data root:

```text
${PI_CODING_AGENT_DIR or OMP agent dir}/omp-kit/session-evidence/
  index.json
  sessions/
    <sha256-of-root-session-file>.json
```

Set `OMP_KIT_EVIDENCE_DIR` or pass `--root` for another local derived-data directory. The store is intentionally outside Git and contains compact summaries rather than copied transcripts or full traces.

## Summary schema

Current schema: `omp-kit.session-evidence/v1`.

Where OMP exposes the information reliably, each root summary retains:

- root session/project/cwd/title/time bounds;
- request, token, cost-equivalent and unpriced-request totals;
- wall/model/tool/idle timing;
- main/subagent/advisor track and request counts;
- model calls, tokens, cost and sampled provider identity;
- per-tool calls/errors/durations;
- subagent activity-envelope overlap;
- structured `omp_kit_feedback` ids/categories/severities from root and child tracks.

Provider identity is sampled through one public `/api/session/entry` lookup per `(track, model)` when needed. Missing values remain `null`. This is **sampled provenance**, not an exact provider-routing ledger: same-model calls routed through multiple providers may be conflated. Request/model/token counts are independent of that sampled label.

Subagent overlap is activity-envelope overlap, not a claim about hardware concurrency.

## OMP interfaces

The collector uses released/public OMP surfaces:

```text
@oh-my-pi/omp-stats
/api/sync
/api/sessions
/api/session/trace
/api/session/entry     # selective provider provenance only
```

Do not replace these with direct `stats.db` queries or raw OMP JSONL parsing.

## Feedback relationship

`omp_kit_feedback` is the complementary qualitative evidence stream. Records retain supported session-file provenance. The collector joins feedback from every trace track so Main and worker observations can appear in the same root-session summary.

Counters do not decide whether delegation or a workflow was good. Feedback does not authorize a change. #5/#8/#9 combine quantitative summaries, qualitative evidence, task acceptance and judgment only when a real decision is needed.

## Durable decisions

Routine summaries stay outside Git. When observations materially support a durable project decision, record the **current conclusion and relevant provenance** in the owning Issue/PR/current doc. Do not copy full raw sessions or create a second repository evidence archive solely for chronology; OMP data, external retained artifacts when genuinely needed, Git history and Issue/PR history provide the underlying provenance.

## Privacy and scope

The collector is local-only. It does not upload telemetry or copy full conversation text into its derived store. Session/project paths, model/tool metadata, usage values and feedback identifiers are still potentially sensitive local metadata.

## Current limitations

- Quality/acceptance is not inferred from token or timing counters.
- Provider identity is sampled per `(track, model)`, not per request.
- Provider sampling depends on the public session-entry payload; unavailable values remain unknown.
- Cross-machine aggregation/replication is not part of v1.
