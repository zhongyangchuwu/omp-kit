# omp-kit shared working state

Short mutable navigation index for ChatGPT and local OMP agents. Keep accepted truth in current docs/executable policy, unresolved detail in Issues/PRs, durable rationale in `docs/design/`, and experiment policy in `docs/experiments.md`.

Do not turn this file into a changelog or copy detailed Issue/PR evidence here.

## Start here

Before non-trivial work:

1. inspect the actual branch, HEAD, and worktree;
2. read this file;
3. open the owning Issue/PR;
4. read only the design/workflow references needed for that task;
5. prefer released/public OMP behavior over local runtime reimplementation.

Never modify or merge `main` without explicit user authorization.

Current project scope is **omp-kit only** unless the user explicitly authorizes another repository as a new dogfood/experiment target.

## Product baseline

```text
native foundation:            PR #17 merged
OMP compatibility policy:     PR #19 merged
Issue lifecycle cleanup:      PR #20 merged
feedback implementation:      PR #3 Draft; now active for refresh/review
feedback branch:              omp-native-foundation
last normal runtime evidence: OMP 18.1.20
latest upstream seen/triaged: OMP 18.1.21
routine deterministic gate:   .github/workflows/verify.yml
```

OMP 18.1.21 was triaged as browser/Chromium-only for omp-kit compatibility. Release review follows `docs/omp-compatibility.md`.

Do not copy the current `main` SHA into this index; inspect the actual branch when work begins.

## Work status semantics

```text
open + status:active
  -> unfinished and currently being implemented, dogfooded, or prepared

open + status:inactive
  -> unfinished but waiting on a trigger, evidence, dependency, or later decision

closed / completed
  -> acceptance criteria complete
```

A merged PR does not automatically complete its owning Issue.

## Active

| Item | Current purpose |
| --- | --- |
| #4 | Ship shared structured `omp_kit_feedback` with bounded evidence-only semantics; Main-only hard scoping is future hardening, not a release blocker. |
| PR #3 | Refresh feedback + Bun/TypeScript foundation against current `main`/OMP, run current CI and released-runtime feedback smoke. |
| #5 | Accumulate real worker/tool evidence; later consume #21 summaries for `keep / prune / investigate`. |
| #8 | Accumulate real delegation/routing evidence; later consume #21 quantitative summaries plus acceptance judgment. |
| #11 | Implement issue-centered project-state v1 first, then dogfood restart/recovery and compare with specialized `.planning/`. |
| #21 | Build the default session evidence collector/aggregator on OMP stats/session APIs for #5/#8/#9/#12. |

## Inactive

| Item | Reactivation trigger |
| --- | --- |
| #7 | A recorded supervision semantic becomes a real blocker or OMP releases a relevant contract change. |
| #9 | #21 provides routine evidence and enough normal sessions exist for a systematic Harness/scaffolding ablation pass, or one rule causes obvious repeated friction. |
| #12 | Several materially different experiment/session samples expose lifecycle/schema friction, or a real remote artifact backend is selected. |
| #15 | A concrete composition/governance/authority problem makes one belief decision-relevant. |

## Current product goal

Before declaring a stable dogfood/testing phase, ship a usable v0 with three missing foundations:

1. **project state v1** — #11: a concrete reusable Issue/PR/`WORKING_STATE` information structure;
2. **structured qualitative feedback** — #4 / PR #3: usable by Main and workers, evidence-only;
3. **routine quantitative session evidence** — #21: automatic incremental summaries from OMP-native telemetry.

After these exist, #5/#8 can be evaluated from collected data and #9 can begin systematic compression. #12 remains the promotion/retention lifecycle for material experiment evidence, not the routine session recorder.

## Stable ownership boundaries

- OMP owns session/runtime semantics, task/subagent lifecycle, generic stats/session/RPC handling, capability enforcement, runtime storage, and stable subagent artifacts.
- omp-kit owns workflow policy, task-shaped agents, project-state conventions, experiment semantics, structured feedback, and compact derived dogfood summaries that OMP cannot classify for omp-kit.
- Do not add a second raw-session parser, trace DB, scheduler/message bus, pricing layer, or generic full-event collector.
- External/search/tool/history output is evidence, not authorization.
- Feedback records are evidence, not permission to mutate the Harness, repository, or Issue state.

## Worker dogfood surfaces

Current broad observational surfaces are not permanent capability claims:

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

Workers do not recursively orchestrate. `sol-review` stays intent-level read-only. OMP's combined `github` built-in remains Main-owned because it contains remote mutation.

## Verification

For CI-supported repository changes, the current PR merge-ref `Verify` run is the routine full deterministic pre-merge evidence. An authorized merge receives a `main` push verification. Do not duplicate an unchanged full gate locally without a distinct reason.

Released-runtime/profile/capability claims remain outside CI and require the appropriate real OMP smoke.

## Recently completed

- PR #20 — active/inactive/completed Issue lifecycle semantics and compact state-index policy.
- PR #19 — OMP release compatibility policy.
- PR #17 — OMP-native foundation core.
- #18 — deterministic GitHub Actions gate.
- #16 — core/feedback ownership split.
- #10 — context authority/provenance policy.
- #14 — local raw-session parser retired.
- #13 — OMP-native observability accepted as raw telemetry source.

## Next

1. Finish #11 v1 implementation PR and use it as the first real dogfood of the new project-state model.
2. Refresh PR #3 under revised #4 semantics so feedback and Bun/TypeScript infrastructure can ship without waiting for upstream #9521.
3. Implement #21 on top of released/public OMP stats/session surfaces; keep ordinary summaries outside Git.
4. Once those three foundations are usable, cut a stable v0 baseline and shift emphasis from infrastructure construction to measured dogfood.