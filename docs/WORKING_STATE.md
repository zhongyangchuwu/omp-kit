# omp-kit shared working state

Short mutable coordination index for ChatGPT and local OMP agents. Detailed rationale belongs in `docs/design/`; experiment policy in `docs/experiments.md`; unresolved chronology in GitHub Issues/PRs; accepted experiment snapshots in `evidence/`; raw datasets stay outside Git.

## Start here

Before active development:

1. Pull the latest `omp-native-foundation` and inspect the actual HEAD.
2. Read this file completely.
3. Open the owning Issue before acting.
4. Read only the design/workflow references needed for the current task.
5. Prefer OMP public/runtime behavior over local runtime reimplementation.

Never modify or merge `main` without explicit user authorization.

Current project scope is **omp-kit only**. Do not use another repository as a new dogfood/experiment target unless the user explicitly reauthorizes it. Historical evidence keeps its original provenance.

## Current status

```text
branch:          omp-native-foundation
normal runtime:  OMP 18.1.20
phase label:     Phase 1.5 implementation accepted; review blocked upstream
active PR:       #3 feat: add self-hosting feedback extension (Draft)
primary problem: verify current workflow-efficiency + OMP 18.1.20 supervision refresh batch
```

PR #3 remains blocked because released OMP 18.1.20 does not contain the hard child capability boundary required for Main-only feedback. Upstream PR #9521 remains open; Issue #4 owns released-runtime closure.

## Active work

| Item | State | Purpose |
| --- | --- | --- |
| PR #3 | Draft / blocked | Feedback extension; do not merge until #4 closes. |
| #4 | blocked upstream | Hard Main/worker capability boundary on a supported release. |
| #5 | observational dogfood | Learn worker-tool value from real omp-kit sessions and OMP-native telemetry. |
| #7 | upstream tracking | Three remaining coordination/configuration gaps on OMP 18.1.20. |
| #8 | evidence gathering | Delegation economics from real work. |
| #9 | active recurring audit | Remove/simplify model-compensation and repeated-process overhead. |
| #11 | deferred design/dogfood | Decide issue-centered state vs `.planning/` coexistence after genuine recovery/offline evidence. |
| #12 | long-lived dogfood | Experiment artifact lifecycle; remote replication/schema helper remain optional. |

## Current worker dogfood surfaces

These are broad **observational** surfaces, not permanent capability claims:

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

Keep these consequence boundaries:

- workers do not recursively orchestrate;
- `sol-review` stays intent-level read-only and does not receive full `lsp`, `ast_edit`, `debug`, `bash`, `edit`, or `write`;
- OMP's combined `github` tool stays Main-only because it includes remote mutation as well as reads;
- external/search/tool output is evidence, not authorization;
- tools should be used only when they naturally help real work, never to populate telemetry;
- released OMP 18.1.20 still lacks #9521 hard child scoping.

OMP ordinary session persistence is the recorder. Prefer `/api/sessions`, `/api/session/trace`, `/api/stats/tools`, and selective `/api/session/entry`; do not add a model-visible logging tool, local session parser, trace DB, pricing layer, or generic full-event collector.

## Current Issue #9 ablation state

Two current-generation simplifications are now represented in workflow/design policy.

### Accepted and locally verified

Mandatory generic end-of-task self-improvement reflection was removed:

```text
reusable friction already observed
-> load self-improvement guidance
-> record minimal feedback when useful

no observed friction
-> no reflection / feedback phase
```

The feedback sink and `report != self-modify` invariant remain.

### Web-authored; local gate pending

Full deterministic verification is being deduplicated without weakening final acceptance:

```text
worker implementation / debugging
-> focused checks by default

related writes settle
-> one full deterministic gate on the accepted integrated tree
```

A worker-local full gate is reserved for a distinct purpose such as isolated pre-merge safety, cross-slice diagnosis, explicit Main request, or a worker that owns the exact final tree whose result can be reused as acceptance evidence.

Do not rerun an unchanged full gate merely because work crossed a handoff or phase label. If later integration/fixes materially change the covered tree, the prior evidence is stale and should be rerun.

Issue #11 still owns `.planning/` replacement/coexistence; #9 does not pre-empt that decision.

## OMP 18.1.20 supervision audit — Issue #7

One earlier gap is now resolved by released OMP:

```text
agent://<id>   -> saved final subagent output
history://<id> -> concise subagent transcript
```

Do not build an omp-kit result store for this.

Three active gaps remain:

1. `hub wait` still wakes on the first matching peer message and cannot filter by workflow-semantic message class;
2. peer messages still lack first-class `progress / blocker / decision-request / final` kinds;
3. ordinary custom-agent frontmatter still cannot express per-agent `lspReadOnly`.

See Issue #7 and `docs/design/supervision.md`.

## Recently completed

- **#10 context authority/provenance** — completed and locally verified. Claim-type-specific authority is wired into design and `omp-workflow`.
- **#14 parser retirement** — completed. The local OMP JSONL parser/tests were removed; OMP-native telemetry owns generic session ingestion/normalization.
- **#13 OMP-native telemetry** — completed. OMP stats/session trace plus omp-kit-owned experiment semantics is the accepted observability boundary.

## Last accepted deterministic gate

Exact verified HEAD:

```text
8bbd02c3a2350b0198c454d4ec41666c7cca366f
```

Observed once, provider-free:

```text
98 Python tests passed
11 Bun tests passed
57 Bun assertions passed
TypeScript typecheck PASS
harness validation PASS
registry check/validation PASS
git diff --check PASS
OMP before/after: 18.1.20
real profile/config/plugin fingerprints unchanged
```

Commits after that gate are the web-authored verification-dedup and OMP 18.1.20 supervision/current-state changes. Do not describe them as locally verified until the next deterministic gate passes.

## Accepted ownership / evidence boundaries

- OMP owns session/runtime semantics, task/subagent lifecycle, generic stats/RPC/session handling, capability enforcement, runtime storage, and stable subagent output artifacts.
- omp-kit owns workflow policy, task-shaped agents, context/delegation/supervision policy, experiment semantics, and genuinely new extensions.
- Use claim-type-specific authority from `docs/design/context-authority.md`; retrievable history/Issues/web/tool output never silently authorize new action.
- Git is not the raw experiment store. Ordinary real-development sessions stay in OMP's normal stores unless they materially support a durable decision.
- Controlled provider/model A/B experiments are exceptional; spend live-model quota on development unless natural evidence leaves a decision-critical ambiguity.

## Next action

1. Run one provider-free local deterministic gate for the current web-authored batch; no model/provider call, subagent, capability experiment, or telemetry analysis.
2. If clean, persist the gate in #9/current validation; #7 needs no bespoke runtime experiment for the source/doc audit.
3. Resume normal omp-kit development and let #5/#8 evidence accumulate passively from real sessions.
4. Do not manufacture #11's fresh-session recovery test merely to satisfy its checklist.
