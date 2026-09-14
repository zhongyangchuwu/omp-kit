# omp-kit shared working state

Short mutable coordination index for ChatGPT and local OMP agents. Detailed rationale belongs in `docs/design/`; experiment policy in `docs/experiments.md`; OMP release triage policy in `docs/omp-compatibility.md`; unresolved chronology in GitHub Issues/PRs; accepted experiment snapshots in `evidence/`; raw datasets stay outside Git.

## Start here

Before active development:

1. Pull the branch that owns the current task and inspect the actual HEAD.
   - use `main` as the baseline for ordinary new work;
   - use `omp-native-foundation` only for feedback-specific PR #3 work owned by Issue #4.
2. Read this file completely.
3. Open the owning Issue / PR before acting.
4. Read only the design/workflow references needed for the current task.
5. Prefer OMP public/runtime behavior over local runtime reimplementation.

Never modify or merge `main` without explicit user authorization.

Current project scope is **omp-kit only**. Do not use another repository as a new dogfood/experiment target unless the user explicitly reauthorizes it. Historical evidence keeps its original provenance.

## Current status

```text
main:                         f7ad0b9ec876948121e5c0c117f2e164ffbc3aa4
native-foundation core:       PR #17 merged
feedback branch:              omp-native-foundation
feedback PR:                  #3 feat: add self-hosting feedback extension (Draft / blocked)
feedback PR base:             main
last evidenced normal runtime: OMP 18.1.20
latest upstream seen:         OMP 18.1.21
latest changelog triaged:     OMP 18.1.21
split record:                 #16 closed completed
deterministic CI:             .github/workflows/verify.yml (#18 closed completed)
```

The native-foundation core is now on `main`. PR #3 targets `main` directly and owns only the feedback-specific delta: one commit and eight changed files at the current candidate.

OMP 18.1.21 has been changelog-triaged. Its changes are limited to Chromium/browser-automation fixes and do not touch an omp-kit compatibility surface, so no dedicated compatibility smoke is required. See `docs/omp-compatibility.md` for the version-risk and impact-override policy.

PR #3 remains blocked because released OMP 18.1.21 still does not contain the hard child capability boundary required for Main-only feedback. Upstream PR #9521 remains open; Issue #4 owns released-runtime closure. Do not replace that blocker with an omp-kit workaround.

Exact current PR readiness and the latest accepted candidate result belong in PR #3 and its GitHub Actions / Issue state. Do not create a new git commit solely to copy a just-tested candidate SHA into this file.

## Active work

| Item | State | Purpose |
| --- | --- | --- |
| PR #3 | Draft / blocked | Feedback-only PR; do not make review-ready until #4 closes. |
| #4 | blocked upstream | Hard Main/worker capability boundary on a supported release. |
| #5 | observational dogfood | Learn worker-tool value from real omp-kit sessions and OMP-native telemetry. |
| #7 | upstream tracking | Three remaining coordination/configuration gaps; unchanged by the 18.1.21 browser-only patch. |
| #8 | evidence gathering | Delegation economics from real work. |
| #9 | active recurring audit | Remove/simplify model-compensation and repeated-process overhead. |
| #11 | deferred design/dogfood | Decide issue-centered state vs `.planning/` coexistence after genuine recovery/offline evidence. |
| #12 | long-lived dogfood | Experiment artifact lifecycle; remote replication/schema helper remain optional. |

Completed PR #17 and maintenance records #16/#18 document the native-foundation landing, core/feedback ownership split, and GitHub Actions deterministic gate. None is an active implementation owner.

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
- released OMP 18.1.21 still lacks the #9521 hard child tool-scoping boundary.

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

The 18.1.21 browser-only patch does not change this audit. See Issue #7 and `docs/design/supervision.md`.

## Validation handling

The landed core `just verify` covers the Python repository suite, harness validation, registry freshness/validation, and `git diff --check`.

`.github/workflows/verify.yml` runs the repository-owned gate on GitHub-hosted runners after checking `uv.lock` freshness and then checks for tracked-file drift. It uses pinned setup actions, Python 3.12, read-only contents permission, no persisted checkout credentials, and no project secrets.

When a tree contains `bun.lock`, the same workflow enables Bun/TypeScript verification, installs frozen dependencies, and derives the Bun version from the repository `packageManager` declaration. Core trees without `bun.lock` skip Bun entirely.

Pre-merge mechanical acceptance is read from the Actions/check status for the owning PR's current merge-ref. After an authorized merge, the `main` push gate verifies the landed commit. Do not add a local handoff merely to rerun the identical deterministic gate. Released-runtime capability claims remain outside CI and require their appropriate runtime smoke.

OMP release compatibility follows `docs/omp-compatibility.md`: every release gets changelog triage, while targeted or full runtime testing is triggered by affected contracts rather than by version churn alone.

## Recently completed

- **PR #17 native foundation core** — merged to `main`; the post-merge `main` Verify gate passed.
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

1. Keep PR #3 Draft while upstream PR #9521 (or an equivalent released implementation) is absent from released OMP.
2. When a supported release gains the hard child capability boundary, run the Issue #4 released-runtime smoke; only then consider making PR #3 ready for review.
3. Triage new OMP releases with `docs/omp-compatibility.md`; do not manufacture tests or Issues for unrelated patch churn.
4. Resume normal omp-kit development from `main`; let #5/#8 evidence accumulate passively from real sessions.
5. Do not manufacture #11's fresh-session recovery test merely to satisfy its checklist.
