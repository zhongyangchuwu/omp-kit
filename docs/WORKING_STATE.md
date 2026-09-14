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
project-state v1:             PR #22 Ready; pending landing
shared feedback:              PR #3 Ready; OMP 18.1.21 Main + worker smoke PASS
session evidence collector:   PR #23 Ready/stacked; OMP 18.1.21 runtime smoke PASS after folder/cwd fix
latest upstream seen/triaged: OMP 18.1.21
routine deterministic gate:   .github/workflows/verify.yml
```

OMP 18.1.21 was triaged as browser/Chromium-only for the previously owned compatibility surfaces. The collector smoke additionally found an OMP stats folder/cwd representation mismatch, now tracked upstream as `can1357/oh-my-pi#12060`; omp-kit uses public `SessionTrace.cwd` for normal filesystem-path filtering instead of reproducing the storage-key encoding.

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
| #4 | Land shared structured `omp_kit_feedback` with bounded evidence-only semantics. Runtime acceptance is complete; close only after PR #3 is in the normal tree and criteria are rechecked. |
| #5 | Accumulate real worker/tool evidence; consume #21 summaries for later `keep / prune / investigate` review. |
| #8 | Accumulate real delegation/routing evidence; consume #21 quantitative summaries plus task acceptance judgment. |
| #11 | Land issue-centered project-state v1, then dogfood fresh-session recovery, duplication, offline limits, and specialized `.planning/` use cases. |
| #21 | Land the default session evidence collector/aggregator. Runtime acceptance is complete; close only after PR #23 is in the normal tree and criteria are rechecked. |

## Inactive

| Item | Reactivation trigger |
| --- | --- |
| #7 | A recorded supervision semantic becomes a real blocker or OMP releases a relevant contract change. |
| #9 | Enough routine #21 evidence accumulates for a systematic Harness/scaffolding ablation pass, or one rule causes obvious repeated friction. |
| #12 | Several materially different experiment/session samples expose lifecycle/schema friction, or a real remote artifact backend is selected. |
| #15 | A concrete composition/governance/authority problem makes one belief decision-relevant. |

## Current product goal

Finish landing the three foundations required for a stable v0 dogfood baseline:

1. **project state v1** — #11 / PR #22;
2. **structured qualitative feedback** — #4 / PR #3;
3. **routine quantitative session evidence** — #21 / PR #23.

After they land, shift emphasis from infrastructure construction to measured dogfood. #5/#8 consume routine evidence, #9 performs later systematic subtraction, and #12 remains the promotion/retention lifecycle for material experiment evidence rather than the routine session recorder.

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

1. Land PR #22 after semantic review and current merge-ref CI; keep #11 open for natural dogfood.
2. Land PR #3 after semantic review/current merge-ref CI; then recheck and close #4 if all criteria are satisfied.
3. Retarget PR #23 to the updated `main`, review the reduced collector-only diff, require a fresh merge-ref CI, then land it and recheck #21.
4. Refresh this index to the landed v0 baseline and perform the small release/readme/version pass for the first usable v0.x release.
