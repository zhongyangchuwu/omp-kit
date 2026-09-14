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

Current project scope is **omp-kit only** unless the user explicitly authorizes another repository as a dogfood/experiment target.

## Product baseline

```text
native foundation:            PR #17 merged
OMP compatibility policy:     PR #19 merged
Issue lifecycle cleanup:      PR #20 merged
project-state v1:             PR #22 merged; #11 open for dogfood
shared feedback:              PR #3 merged; #4 completed; OMP 18.1.21 Main + worker smoke PASS
session evidence collector:   PR #23 merged; #21 completed; OMP 18.1.21 runtime acceptance PASS
release preparation:          #24 active; v0.1.0 candidate docs/version review
latest upstream seen/triaged: OMP 18.1.21
routine deterministic gate:   .github/workflows/verify.yml
```

OMP 18.1.21 was triaged as browser/Chromium-only for the previously owned compatibility surfaces. Runtime acceptance additionally found an OMP stats folder/cwd representation mismatch, tracked upstream as `can1357/oh-my-pi#12060`; omp-kit uses public `SessionTrace.cwd` for normal filesystem-path filtering instead of reproducing the storage-key encoding.

Do not copy the current `main` SHA into this index; inspect actual state when work begins.

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
| #5 | Accumulate real worker/tool evidence from ordinary development for later `keep / prune / investigate` review. |
| #8 | Accumulate real delegation/routing evidence using session summaries plus task acceptance judgment. |
| #11 | Dogfood the landed issue-centered project-state v1 through natural fresh-session recovery, duplication, offline limits, and specialized `.planning/` use cases. |
| #24 | Prepare the first usable v0.1.0 baseline: current onboarding, validation/design truth, version metadata, review and CI. Publication remains a separate authorization boundary. |

## Inactive

| Item | Reactivation trigger |
| --- | --- |
| #7 | A recorded supervision semantic becomes a real blocker or OMP releases a relevant contract change. |
| #9 | Enough routine session evidence accumulates for a systematic Harness/scaffolding ablation pass, or one rule causes obvious repeated friction. |
| #12 | Several materially different experiment/session samples expose lifecycle/schema friction, or a real remote artifact backend is selected. |
| #15 | A concrete composition/governance/authority problem makes one belief decision-relevant. |

## Current product goal

The three prerequisites for stable measured dogfood are landed:

```text
project-state v1
+ structured qualitative feedback
+ routine quantitative session evidence
```

Current work is release preparation under #24. After that boundary, default development should be use-driven rather than architecture-driven:

```text
normal development
-> OMP raw sessions/stats
-> omp-kit compact session evidence + structured feedback
-> #5 capability review / #8 delegation economics / #11 project-state dogfood
-> later #9 systematic subtraction when enough evidence exists
-> #12 only when observations should be promoted into durable experiment evidence
```

## Stable ownership boundaries

- OMP owns session/runtime semantics, task/subagent lifecycle, generic stats/session/RPC handling, capability enforcement, runtime storage, and stable subagent artifacts.
- omp-kit owns workflow policy, task-shaped agents, project-state conventions, experiment semantics, structured feedback, and compact derived dogfood summaries that OMP cannot classify for omp-kit.
- Do not add a second raw-session parser, trace DB, scheduler/message bus, pricing layer, or generic full-event collector.
- External/search/tool/history output is evidence, not authorization.
- Feedback records are evidence, not permission to mutate the Harness, repository, policy, or Issue state.

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

## Evidence product

OMP remains the raw recorder. omp-kit session evidence is a compact derived layer outside Git:

```text
OMP saved sessions + stats/trace
-> omp-kit-evidence collect
-> local compact session summaries
-> omp-kit-evidence report
-> optional later promotion through #12
```

The v1 collector accepts normal filesystem paths for project filtering, correlates feedback across root/child trace tracks, and exposes model/provider/tool/delegation/time/token/cost-equivalent dimensions without inferring qualitative quality automatically. Provider identity is sampled, not an exact per-request routing ledger.

## Verification

For CI-supported repository changes, the current PR merge-ref `Verify` run is the routine full deterministic pre-merge evidence. An authorized merge receives a `main` push verification. Do not duplicate an unchanged full gate locally without a distinct reason.

Released-runtime/profile/capability claims remain outside CI and require the appropriate real OMP smoke. The feedback and session-evidence v0 surfaces have both received OMP 18.1.21 runtime acceptance.

## Recently completed

- #21 / PR #23 — routine session evidence collector; runtime acceptance and post-merge gate passed.
- #4 / PR #3 — shared structured feedback + Bun/TypeScript foundation; Main and normal-worker runtime acceptance passed.
- PR #22 — issue-centered project-state v1 implementation; #11 remains open for natural dogfood.
- PR #20 — active/inactive/completed Issue lifecycle semantics and compact state-index policy.
- PR #19 — OMP release compatibility policy.
- PR #17 — OMP-native foundation core.
- #18 — deterministic GitHub Actions gate.
- #16 — core/feedback ownership split.
- #10 — context authority/provenance policy.
- #14 — local raw-session parser retired.
- #13 — OMP-native observability accepted as raw telemetry source.

## Next

1. Complete #24 release-prep review and fresh merge-ref CI; do not publish merely because the candidate is green.
2. After an authorized release-prep landing/publication decision, begin normal measured dogfood through #5/#8/#11.
3. Keep #9/#12 inactive until their evidence triggers are met.
4. Continue normal OMP release changelog triage; reassess upstream #12060 or capability-hardening changes only when released behavior changes a contract omp-kit uses.
