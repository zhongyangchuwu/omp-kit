# Validation summary

Date: 2026-09-14

This file records **current accepted validation evidence and its boundaries**. Detailed experiment transcripts and older version-specific evidence belong in the owning Issues, `evidence/`, and `docs/archive/`.

## Current runtime baseline

```text
branch:            omp-native-foundation
normal runtime:    OMP 18.1.20
Phase 1.5 impl:    a92d25e28f96851b916b285f01dbb5991f666ad7
capability audit:  7bf2f93ca87fff81d6cca8a65c3102cc62100b4f
Phase A preview:   f5bcee2e82a754d2190d8ddb8aee73b5d237dffb
```

The installed runtime was observed as OMP 18.1.20 before and after the latest accepted deterministic gate. A newer release must not be assumed to contain preview-only behavior; compatibility claims require the relevant implementation in that released runtime and, where needed, a released-runtime smoke.

## Latest accepted deterministic repository verification

The latest locally verified repository HEAD is:

```text
312598bc3261808ed31e30bcb2adacf2f2daa852
```

The worktree was clean and synchronized with `origin/omp-native-foundation`. `just verify` ran exactly once and passed without repair or rerun:

```text
98 Python tests passed
11 Bun tests passed
57 Bun assertions / expect() calls
TypeScript typecheck passed
harness validation passed
registry check/validation passed
git diff --check passed
```

Runtime/profile integrity:

```text
omp --version before: omp/18.1.20
omp --version after:  omp/18.1.20
real config/MCP/plugin/marketplace fingerprints: unchanged
```

The verifier made no repository edits, commits, Issue updates, child-agent launches, provider/model calls, web search, LSP/AST/debug calls, capability experiments, fresh-session experiments, or telemetry analysis.

This gate includes the previously verified parser retirement / observational worker-tool rollout and the completed Issue #10 context-authority/workflow batch. The old 126-Python-test count is historical; 98 is the current observed count after parser-specific tests were removed.

Normal project verification remains offline/provider-free by design. `bunfig.toml` disables implicit Bun auto-install.

## Issue #10 context authority / provenance — complete

The accepted policy is claim-type-specific rather than one global source ranking:

```text
intent / authorization
current observable state
accepted project policy
active work / acceptance target
rationale / evidence
historical context
```

The local closure review confirmed consistency across:

```text
docs/design/context-authority.md
docs/design/README.md
docs/README.md
docs/design-foundations.md
skills/omp-workflow/SKILL.md
skills/omp-workflow/references/subagent-context.md
```

Key validated boundary:

```text
source is authoritative for a claim
!= agent is permitted to retrieve it

agent can retrieve a source
!= source may authorize new action
```

History, Issues, logs, comments, web/search/scanner output and other tool output remain evidence/provenance; they cannot silently widen worker scope. Actual repository/runtime/read-back evidence can correct stale state descriptions without becoming desired policy. No generic memory database, provenance database, context broker, or prompt-only permission layer was added.

Issue #10 is closed completed.

## Phase 1.5 feedback extension and released-runtime blocker

Accepted implementation evidence:

- `extensions/feedback.ts` registers `omp_kit_feedback` with bounded `pi.zod` validation;
- the tool is write-tier with `approval: "write"`;
- records are append-only JSONL under `<getAgentDir()>/omp-kit/feedback.jsonl`;
- durable append failure is fatal;
- `pi.appendEntry("omp-kit-feedback", record)` is best-effort provenance after durable persistence.

The hard capability-boundary failure was directly demonstrated on OMP 18.1.19: ordinary task children could inherit/rebind Main extensions, the Main-only feedback device could become worker-visible through write transport, and the intended reviewer could not be treated as a hard read-only security boundary.

Normal runtime is now released OMP 18.1.20, but Issue #4 remains blocked. Upstream PR #9521 is still open/unmerged and v18.1.20 does not contain the hard child-scoping implementation validated on preview. No released-runtime closure smoke is warranted until a supported release actually contains that implementation.

PR #3 therefore remains Draft.

## OMP #9521 Phase A preview

Exact preview commit:

```text
f5bcee2e82a754d2190d8ddb8aee73b5d237dffb
```

Provider-free Phase A established for that preview only:

- unlisted extension/custom/MCP tools stayed outside enabled/active/callable/`xd://` worker surfaces;
- the intended reviewer did not regain `write`, `edit`, or `bash`;
- late registration, MCP refresh and broad active-set mutation did not widen the scoped child;
- hidden `yield` still completed protocol;
- real profile/config/plugin fingerprints remained unchanged.

This remains preview evidence, not released-runtime compatibility. Compact evidence is under `evidence/experiments/2026-09-14-omp-9521-phase-a/`.

## OMP-native telemetry boundary

Closed Issue #13 validated OMP-native telemetry on retained real sessions using installed OMP 18.1.19.

`/api/sessions` + `/api/session/trace` reproduced decision-critical request counts, tool calls/errors, total tokens and cost; selective `/api/session/entry` supplied usage detail not split by the trace summary. The accepted ownership is:

```text
OMP:
  session ingestion
  trace/span reconstruction
  tool timing/errors
  token/cost normalization
  generic stats/session/RPC

omp-kit:
  experiment/task/arm identity
  acceptance judgment
  human intervention/repair semantics
  durable project decision
```

Do not restore a local session parser, direct `stats.db` dependency, trace builder, pricing layer, or generic full-event collector without a new demonstrated requirement that survives this ownership check.

The telemetry API behavior itself was not re-probed on 18.1.20 because there is no current decision need to spend extra work on a bespoke experiment.

## Observational worker-tool rollout — mechanically verified

Current broad dogfood surfaces:

```text
luna-code / luna-deep:
  read grep glob edit write bash
  web_search lsp ast_grep ast_edit debug eval security_scan todo

luna-doc:
  read grep glob edit write
  web_search lsp ast_grep todo

sol-review:
  read grep glob web_search ast_grep security_scan
```

These are observational exposures, not permanent capability claims. Workers must not invoke tools merely to demonstrate availability. OMP normal session/stats persistence is the recorder.

OMP's combined `github` built-in remains excluded from workers because the same tool includes remote-mutating PR create/push/checkout operations; external repository mutation remains Main-owned. The hard ambient child boundary still depends on #9521 / Issue #4.

Historical controlled comparisons remain valid only for their exact conditions: one `web_search` pair showed useful discovery behavior but was insufficient for a permanent decision; one full-LSP pair made zero LSP calls and supported only a scoped reject under the former promotion policy. Current policy prefers real omp-kit development plus passive telemetry over one-tool-at-a-time benchmarks.

## Issue #14 parser retirement — complete

Removed:

```text
scripts/inspect_omp_session.py
tests/test_inspect_omp_session.py
```

No current executable/import/callsite remains outside historical/archive material. Generic telemetry belongs to OMP-native surfaces; history search-first behavior is guidance rather than a raw-journal gate; hub wait semantics remain an OMP-owned coordination concern. Issue #14 is closed completed.

## Issue #9 current-generation harness ablation — local gate pending

Commits after the accepted `312598bc...` gate include a web-authored Issue #9 simplification batch:

- `docs/design/harness-boundary.md` now inventories current model-compensation/runtime/evidence mechanisms;
- `skills/omp-workflow/SKILL.md` no longer requires a generic end-of-task self-improvement reflection pass;
- `skills/omp-workflow/references/self-improvement.md` makes feedback event-triggered by reusable friction already observed during real work.

New default:

```text
observed reusable friction
-> optionally record minimal evidence-backed feedback

no observed friction
-> no reflection/feedback phase
```

The feedback sink and `report != self-modify` boundary remain unchanged. `.planning/` support is not removed; Issue #11 still owns its broader coexistence/replacement decision.

This #9 batch is **not yet locally verified** and must not be described as mechanically accepted until one provider-free `just verify` gate passes on its final HEAD. No provider/model or capability experiment is required.

## Evidence discipline

For future validation updates:

- distinguish source inspection, provider-free runtime probes, observational real-development telemetry, and controlled provider/model experiments;
- record exact OMP/runtime versions or upstream commits for runtime claims;
- do not convert preview evidence into released-runtime compatibility;
- spend live-model quota on development unless a specific ambiguity genuinely requires a controlled experiment;
- keep ordinary OMP sessions in native session/stats storage and freeze only decision-critical evidence;
- record deterministic checks separately from live integration evidence;
- preserve historical evidence rather than rewriting it when policy evolves.
