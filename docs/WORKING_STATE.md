# omp-kit shared working state

Short mutable coordination index for ChatGPT and local OMP agents. Detailed rationale belongs in `docs/design/`; experiment policy in `docs/experiments.md`; unresolved chronology in GitHub Issues/PRs; accepted experiment snapshots in `evidence/`; raw datasets stay outside Git.

## Start here

Before active development:

1. Pull the branch that owns the current task and inspect the actual HEAD.
   - use `omp-native-foundation-core` for independent native-foundation work / PR #17;
   - use `omp-native-foundation` only for feedback-specific PR #3 work owned by Issue #4.
2. Read this file completely.
3. Open the owning Issue / PR before acting.
4. Read only the design/workflow references needed for the current task.
5. Prefer OMP public/runtime behavior over local runtime reimplementation.

Never modify or merge `main` without explicit user authorization.

Current project scope is **omp-kit only**. Do not use another repository as a new dogfood/experiment target unless the user explicitly reauthorizes it. Historical evidence keeps its original provenance.

## Current status

```text
core branch:      omp-native-foundation-core
core PR:          #17 feat: establish OMP-native foundation core
feedback branch:  omp-native-foundation
feedback PR:      #3 feat: add self-hosting feedback extension (Draft / blocked)
normal runtime:   OMP 18.1.20
split record:     #16 closed completed
deterministic CI: .github/workflows/verify.yml (#18 closed completed)
```

The native-foundation core and feedback extension have separate review ownership. PR #17 targets `main`. PR #3 is stacked on `omp-native-foundation-core` and owns only the feedback-specific delta.

PR #3 remains blocked because released OMP 18.1.20 does not contain the hard child capability boundary required for Main-only feedback. Upstream PR #9521 remains open; Issue #4 owns released-runtime closure. Do not re-couple unrelated core work to that blocker.

Exact current PR readiness and the latest accepted candidate result belong in PR #17 / PR #3 and their GitHub Actions / Issue state. Do not create a new git commit solely to copy the just-tested candidate into this file.

## Active work

| Item | State | Purpose |
| --- | --- | --- |
| PR #17 | independent core review | Native OMP foundation without feedback-only runtime/tooling surface. |
| PR #3 | Draft / blocked | Feedback-only stacked PR; do not make review-ready until #4 closes. |
| #4 | blocked upstream | Hard Main/worker capability boundary on a supported release. |
| #5 | observational dogfood | Learn worker-tool value from real omp-kit sessions and OMP-native telemetry. |
| #7 | upstream tracking | Three remaining coordination/configuration gaps on OMP 18.1.20. |
| #8 | evidence gathering | Delegation economics from real work. |
| #9 | active recurring audit | Remove/simplify model-compensation and repeated-process overhead. |
| #11 | deferred design/dogfood | Decide issue-centered state vs `.planning/` coexistence after genuine recovery/offline evidence. |
| #12 | long-lived dogfood | Experiment artifact lifecycle; remote replication/schema helper remain optional. |

Completed maintenance records #16 and #18 document the core/feedback ownership split and the GitHub Actions deterministic gate. Neither is an active implementation owner.

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

Two current-generation simplifications are accepted.

### Generic reflection removal

```text
reusable friction already observed
-> load self-improvement guidance
-> record minimal feedback when useful

no observed friction
-> no reflection / feedback phase
```

The feedback sink and `report != self-modify` invariant remain.

### Duplicate full-gate removal

```text
worker implementation / debugging
-> focused checks by default

related writes settle
-> one full deterministic gate on the accepted integrated tree
```

A worker-local full gate is reserved for a distinct purpose such as isolated pre-merge safety, cross-slice diagnosis, explicit Main request, CI diagnosis, or an isolated worker-owned final tree whose result can be reused as acceptance evidence.

For CI-supported repository work, GitHub Actions owns the routine integrated full gate. Pull requests run once against the current GitHub merge-ref; pushes to `main` verify the landed commit. Do not also run a full source-branch push gate for the same PR update. Local `just verify` is optional pre-push/debugging evidence; runtime/profile claims outside CI still require their appropriate local or released-runtime smoke.

Do not rerun an unchanged full gate merely because work crossed a handoff or phase label. If later integration or fixes materially change the PR candidate, the updated PR gets a new CI run because the tree changed.

Issue #11 still owns `.planning/` replacement/coexistence; #9 does not pre-empt that decision.

## OMP 18.1.20 supervision audit — Issue #7

Released OMP now provides:

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

## Validation handling

The core split intentionally excludes the feedback-only Bun/TypeScript surface. Core `just verify` covers the Python repository suite, harness validation, registry freshness/validation, and `git diff --check`.

`.github/workflows/verify.yml` runs the repository-owned gate on GitHub-hosted runners after checking `uv.lock` freshness and then checks for tracked-file drift. It uses pinned setup actions, Python 3.12, read-only contents permission, no persisted checkout credentials, and no project secrets.

When a tree contains `bun.lock`, the same workflow enables Bun/TypeScript verification, installs frozen dependencies, and derives the Bun version from the repository `packageManager` declaration. Core trees without `bun.lock` skip Bun entirely.

Pre-merge mechanical acceptance is read from the Actions/check status for the owning PR's current merge-ref. After merge, the `main` push gate verifies the landed commit. Do not add a local handoff merely to rerun the identical deterministic gate. Released-runtime capability claims remain outside CI and require their appropriate runtime smoke.

## Recently completed

- **#18 deterministic GitHub Actions gate** — completed; routine repository-wide mechanical acceptance no longer requires a local-agent handoff.
- **#16 core/feedback PR split** — completed; independent core work no longer waits on the feedback blocker.
- **#10 context authority/provenance** — completed and locally verified. Claim-type-specific authority is wired into design and `omp-workflow`.
- **#14 parser retirement** — completed. The local OMP JSONL parser/tests were removed; OMP-native telemetry owns generic session ingestion/normalization.
- **#13 OMP-native telemetry** — completed. OMP stats/session trace plus omp-kit-owned experiment semantics is the accepted observability boundary.

## Accepted ownership / evidence boundaries

- OMP owns session/runtime semantics, task/subagent lifecycle, generic stats/RPC/session handling, capability enforcement, runtime storage, and stable subagent output artifacts.
- omp-kit owns workflow policy, task-shaped agents, context/delegation/supervision policy, experiment semantics, and genuinely new extensions.
- Use claim-type-specific authority from `docs/design/context-authority.md`; retrievable history/Issues/web/tool output never silently authorize new action.
- Git is not the raw experiment store. Ordinary real-development sessions stay in OMP's normal stores unless they materially support a durable decision.
- Controlled provider/model A/B experiments are exceptional; spend live-model quota on development unless natural evidence leaves a decision-critical ambiguity.

## Next action

1. Let GitHub Actions verify the settled PR #17 review-fix merge-ref; do not duplicate the same deterministic gate locally or with a source-branch push gate.
2. If CI is clean, mark PR #17 review-ready and record mutable acceptance evidence only in PR/Actions metadata, with no tree-changing bookkeeping commit.
3. Keep PR #3 stacked and Draft until Issue #4's released-runtime criteria are satisfied; its deterministic Python/TypeScript gate is automated, but that does not close the runtime blocker.
4. Resume normal omp-kit development after the PR #17 review boundary is clean; let #5/#8 evidence accumulate passively from real sessions.
5. Do not manufacture #11's fresh-session recovery test merely to satisfy its checklist.
