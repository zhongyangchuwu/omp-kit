# Experiment data and evidence policy

This document defines the current storage and data-shape policy for omp-kit experiments. The design deliberately separates **repository evidence**, **local working data**, and **retained raw artifacts** so Git remains a code/decision system rather than a dataset store.

The policy is intentionally OMP-native: when OMP already emits session, trace, request, usage, or tool telemetry, omp-kit should consume those interfaces rather than parse OMP journals or maintain a parallel stats database.

## Storage tiers

### 1. Git-tracked evidence

Git stores the information needed to understand and audit a decision without carrying the experiment dataset itself.

For an accepted experiment that materially informs project policy, keep a small bundle under:

```text
evidence/experiments/<experiment-id>/
  README.md
  manifest.json
```

Optional small `summary.json` is allowed only for decision-critical normalized metrics that remain useful without the raw dataset.

Git-tracked evidence should contain:

- experiment question and final decision;
- exact omp-kit / OMP / upstream revisions;
- controlled variables and compared arms;
- task/spec identifiers or hashes;
- OMP telemetry interfaces used;
- compact decision-critical metrics;
- artifact identity, retention state, integrity hash/index, and remote reference when one exists;
- evidence limitations and retention assumptions;
- Issue / PR / design-record links.

Git should **not** become the default home for:

- full session JSONL transcripts;
- complete model conversations;
- complete stats traces/request dumps;
- stdout/stderr logs;
- temporary source checkouts or build products;
- large benchmark outputs;
- repeated per-run files whose only purpose is later analysis.

Historical small bundles already committed before this policy may remain. Do not rewrite history merely to conform them retroactively.

### 2. Local ignored experiment workspace

Raw and intermediate experiment data should first land in a gitignored workspace, conceptually:

```text
.experiments/
  <experiment-id>/
    <run-id>/
```

This is staging/cache, not the only durable copy. It may contain preview builds, copied OMP session trees, exported traces, request details, stdout/stderr, generated tables, and analysis scratch data.

Do not leave the only retained copy of an accepted experiment in `/tmp`. During an active experiment, avoid reorganizing raw files merely to satisfy the final schema; freeze and inventory them after the run completes.

### 3. Retained artifact store

Retained raw experiment data belongs in an **artifact store outside Git**. A cloud service is optional replication, not part of experiment identity and not a prerequisite for accepting a run.

Use one immutable directory/object prefix per experiment and run:

```text
<artifact-root>/<experiment-id>/<run-id>/
```

The first artifact root may be a persistent local directory outside the repository checkout. A conventional Linux/WSL location is:

```text
${XDG_DATA_HOME:-$HOME/.local/share}/omp-kit/artifacts/
```

but the actual root is user configuration rather than a committed repository path. A school cloud drive, WebDAV target, object store, or other backend can later replicate the same immutable bundle.

Artifact identity must remain stable when storage moves. Use these retention states conceptually:

```text
staging         raw run still being assembled under .experiments/
local-retained  frozen/checksummed canonical local artifact exists
replicated      canonical artifact has at least one verified remote replica
discarded       raw data intentionally not retained; Git evidence records this
```

A completed material experiment should normally reach `local-retained` before derived analysis mutates or deletes working files. Remote replication can happen later without changing experiment/run ids or the checksum of the frozen bundle.

## Experiment identity model

Use three levels:

```text
experiment
  question / comparison / decision unit

arm
  baseline, treatment, or another controlled condition

run
  one concrete execution of one arm
```

IDs should be immutable once cited. A materially changed rerun gets a new run id; a changed experiment question or comparison gets a new experiment id.

Artifact location is not identity:

```text
experiment/run id
    != local filesystem path
    != cloud provider
    != remote URI
```

## Repository manifest shape

`manifest.json` is the stable evidence/provenance record. Initial schema identifier:

```text
omp-kit.experiment/v1
```

Recommended fields:

```json
{
  "schema": "omp-kit.experiment/v1",
  "id": "...",
  "date": "YYYY-MM-DD",
  "issue": 0,
  "question": "...",
  "status": "accepted",
  "decision": {
    "outcome": "pass|fail|recommend-now|later|reject|inconclusive",
    "summary": "..."
  },
  "revisions": {
    "ompKit": "...",
    "omp": "...",
    "upstream": []
  },
  "design": {
    "arms": [],
    "controlledVariables": [],
    "decisionMetrics": []
  },
  "telemetry": {
    "source": "omp",
    "interfaces": []
  },
  "artifacts": {
    "id": "...",
    "state": "local-retained|replicated|discarded",
    "indexSha256": "...",
    "remote": null
  },
  "limitations": []
}
```

Do not commit machine-specific absolute local paths merely to locate an artifact. Local configuration resolves the artifact root; the manifest records stable artifact identity and integrity. When a remote replica exists, `remote` may record a backend-neutral URI/reference and any verification metadata needed to retrieve it.

The schema is a contract, not an excuse to force irrelevant fields into every experiment. Missing/unmeasured values should be explicit rather than fabricated. Existing accepted bundles may retain earlier v1 field shapes; corrections or migrations must be explicit rather than silently changing historical observations.

## Raw run bundle shape

Retained artifact bundles should use a predictable structure so analysis can be repeated without guessing filenames:

```text
<run-id>/
  run.json
  checksums.sha256
  omp/
    session-summary.json
    session-trace.json
    session/
      ... original OMP session transcript tree when retained ...
    requests/
      ... request-detail exports when retained ...
  task/
    prompt-or-spec.txt
    inputs/
  output/
    worker-result.*
    stdout.log
    stderr.log
  analysis/
    ... derived tables/plots, never the only copy of raw evidence ...
```

`run.json` records run identity, arm, timestamps, resolved model/provider/thinking mode, task/spec hash, effective tool surface, relevant environment facts, OMP session file/id, telemetry capture status, and file inventory.

Do not require every optional directory. Preserve the smallest raw set that allows the decision to be audited or re-analysed.

When useful, retain both:

```text
OMP original session transcript = source data
OMP exported session trace      = interpretation produced by that OMP version
```

This allows future OMP versions to re-analyse the original transcript while preserving what the experiment saw at decision time.

## OMP-native telemetry

Prefer these OMP 18.1.19 interfaces before implementing any omp-kit telemetry parser or database.

### Post-hoc / cross-session: `omp stats`

The stats server exposes DB-backed summaries and raw-session-derived traces. Relevant endpoints include:

```text
GET /api/sessions
GET /api/session/trace?file=...
GET /api/session/entry?file=...&id=...
GET /api/stats/recent?limit=...
GET /api/request/<id>
GET /api/stats/tools
GET /api/stats
GET /api/sync
```

The session trace is especially important because OMP itself reconstructs spans directly from its session JSONL and returns main/subagent/advisor tracks with turn/model/tool/subagent/background spans, timing, tokens/cost, TTFT, errors, child links, wall/model/tool/idle totals, and per-tool duration aggregates.

### Controlled live session: OMP RPC

When an experiment already drives OMP through RPC, use the public RPC commands/client before adding another observer:

```text
get_session_stats
get_state
get_messages / get_messages_page
get_subagents
get_subagent_messages
```

`get_session_stats` is useful for before/after snapshots of a controlled run; the stats trace API is richer for post-hoc hierarchical timing/tool analysis.

### Published TypeScript package

`@oh-my-pi/omp-stats` exposes aggregate helpers programmatically, and its package wildcard exports make stats submodules such as `trace` and `aggregator` importable. Prefer the HTTP API when possible because it is language-neutral and avoids direct coupling to internal storage. Use direct package APIs only when they materially simplify a supported workflow.

### Retained validation

A retained real-session probe using installed OMP 18.1.19 showed that `/api/sessions` and `/api/session/trace` reproduce request counts, tool calls/errors, total tokens and cost, while selective `/api/session/entry` can recover usage detail absent from the trace summary. Trace wall time intentionally measures session-turn boundaries rather than surrounding harness/process overhead.

The trace covers session identity, model/tool spans and durations, errors, wall/model/tool/idle time, requests, total tokens, cost/unpriced status, TTFT and per-tool aggregates. Parent/child overlap still requires a real session that actually contains those tracks. Post-hoc trace records tools actually used, not the unused effective allowlist; experiment `run.json` owns configured surfaces and experiment semantics such as arm, task hash, acceptance and human intervention.

For comparable material experiments, the minimum retained set is:

```text
run.json
checksums.sha256
omp/session-summary.json
omp/session-trace.json
omp/session/                 # original JSONL + referenced artifact tree when re-analysis value justifies it
task/prompt-or-spec.txt
output/worker-result.*
```

Request-detail exports are not retained by default. Use `/api/session/entry` only when a decision-critical usage/detail field is absent from trace. This result supports OMP-native export plus omp-kit-owned metadata; it does not justify a local parser/database or generic full-event collector.

## Routine observational dogfood

Ordinary omp-kit development is the default source of capability evidence. A normal development session is **not automatically a controlled experiment** and should not be forced into an A/B harness merely to evaluate one tool.

The default capability-learning loop is:

```text
broad role-appropriate worker surface
-> real omp-kit development
-> OMP records the ordinary session
-> post-hoc stats/trace review
-> keep / prune / investigate a capability
```

OMP session persistence and stats/trace are the recording layer. Do **not** add a model-visible logging tool, generic event collector, or extra model turn just to record tool use. Such instrumentation consumes quota and can change the behavior being observed.

Periodic observational review should focus on facts OMP already exposes:

- which worker/role naturally selected each tool;
- tool call counts, errors and durations;
- wall/model/tool/idle timing;
- requests, tokens and cost;
- repeated retries or tool-induced noise;
- whether the tool contributed material evidence or an accepted change;
- configured-but-unused capabilities when the effective surface is known from agent/run metadata.

Do not ask a worker to call a tool merely so it appears in telemetry. Natural non-use in one session is weak evidence; repeated non-use across relevant real work, especially with measurable prompt/schema cost, can support pruning. Repeated useful natural use can support keeping a capability without a bespoke benchmark for every tool.

Only freeze/export a routine session into a canonical artifact and Git evidence bundle when its observations materially support a durable project decision. OMP's normal session/stats store is sufficient for ongoing dogfood; ordinary sessions do not each need `run.json`, checksums, or cloud replication.

Use a controlled A/B experiment only when observational evidence exposes a specific ambiguity that cannot be resolved from real work—for example, when the same task outcome plausibly depends on one capability and the cost of a wrong default justifies the extra provider/model usage.

## Interfaces to avoid depending on

Do not build core omp-kit analysis around:

- direct SQL against `~/.omp/stats.db`;
- a second parser for `~/.omp/agent/sessions/*.jsonl`;
- copied OMP journal schemas;
- a parallel session/trace database;
- provider-specific telemetry when OMP already normalizes the same information.

If an OMP interface lacks a required field, first document the missing observation and consider an upstream request. Add local instrumentation only for genuinely omp-kit-owned experimental variables that OMP cannot know, such as experiment arm, task hash, acceptance judgment, or human intervention.

## Analysis boundary

omp-kit may eventually provide a thin analysis/export workflow, but its responsibility should be limited to:

```text
OMP-native telemetry
+ experiment metadata owned by omp-kit
-> normalized experiment table / comparison
```

It should not own OMP session ingestion, pricing, trace reconstruction, agent lifecycle, or general observability infrastructure.

Avoid full raw event accumulation when OMP-native trace/session exports are sufficient. An earlier one-off collector produced tens of megabytes per run because repeated full event/result material was captured; that is counter-evidence for custom collectors, not a target format for future work.

Do not build an analysis helper pre-emptively. A small exporter/report helper earns maintenance cost only after repeated real-session reviews show a stable manual query that OMP itself does not already present conveniently.

## Current rollout

1. Historical controlled experiments remain immutable evidence for the conditions under which they were run; their identifiers and retained artifacts are not rewritten.
2. OMP 18.1.19 native sessions/trace plus selective entry usage is the accepted telemetry path when paired with omp-kit-owned metadata for material experiments.
3. Worker capability evaluation now defaults to routine observational dogfood in real omp-kit development rather than one-tool-at-a-time synthetic A/B runs.
4. Broad role-appropriate capability surfaces may be enabled first, then pruned from natural-use evidence while preserving consequence boundaries such as read-only review.
5. Remote replication of a selected experiment artifact remains optional within Issue #12's evidence lifecycle; accepted artifacts may remain `local-retained`. A general remote publication/query pipeline for routine session-derived data belongs to #33 and is not a prerequisite for experiment acceptance.
6. Revisit the manifest schema or add a tiny analysis/export helper only after real development creates a repeated need. Do not build a benchmark platform first.

Tracking: GitHub Issues #5, #12, #33, and completed #13.
