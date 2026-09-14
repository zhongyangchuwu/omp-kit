# OMP Kit working state

Short navigation index for ChatGPT and local OMP agents. Keep detailed unresolved work in Issues and implementation/review evidence in PRs. Do not turn this file into a changelog.

## Start here

1. inspect the actual branch, HEAD and worktree;
2. read this file;
3. open the owning Issue/PR;
4. read only the current references needed for the task;
5. prefer released/public OMP behavior over local runtime reimplementation.

Never modify or merge `main` without explicit user authorization.

## Product baseline

```text
candidate version:             0.1.0
native foundation:             landed
project-state v1:              landed; #11 dogfood remains open
shared feedback:               landed; #4 completed; OMP 18.1.21 Main + worker smoke PASS
session evidence:              landed; #21 completed; OMP 18.1.21 runtime acceptance PASS
pre-release subtraction:       #26 completed; PR #29 merged into release-prep
release preparation:           PR #25 final candidate; current merge-ref CI required before any landing
latest upstream seen/triaged:  OMP 18.1.21
```

OMP 18.1.21 collector acceptance found the public stats folder/cwd mismatch tracked as `can1357/oh-my-pi#12060`; normal project filtering uses public trace `cwd`.

## Issue lifecycle

```text
open + status:active   -> unfinished and currently being worked/dogfooded
open + status:inactive -> unfinished but waiting on a trigger/evidence/decision
closed/completed       -> acceptance criteria complete or deliberately superseded
```

A merged PR does not automatically complete its owning Issue.

## Active

| Item | Current purpose |
| --- | --- |
| #5 | Accumulate real worker/tool evidence for later capability pruning. |
| #8 | Accumulate real delegation/model/time/cost evidence for routing decisions. |
| #11 | Dogfood issue-centered project-state recovery through real future sessions. |

## Inactive

| Item | Reactivation trigger |
| --- | --- |
| #7 | A supervision semantic becomes a concrete blocker or OMP changes the relevant contract. |
| #9 | Enough real post-v0 evidence accumulates for another systematic behavioral-scaffolding subtraction pass. |
| #12 | A real artifact-retention/reproducibility problem exceeds Git/Issue/PR/current-doc + local session-evidence ownership. |
| #15 | A concrete composition/governance/authority problem makes one remaining belief decision-relevant. |
| #24 | PR #25 is technically prepared; landing to `main` waits for explicit authorization and a current green merge-ref gate. |

## Current product shape

The v0.1.0 candidate is intentionally small:

```text
4 model-neutral agents
+ 4 core Skills
+ Main workflow rule
+ structured feedback extension
+ compact session-evidence CLI
+ current docs
+ Bun-only deterministic verification
```

Core Skill set:

```text
omp-workflow
git-workflow
bounded-executor
omp-review
```

Optional first-party workflow capabilities belong in separately installed **Companion** packages if real use justifies them. Service/provider/MCP capabilities belong in separately installed **Integration** packages. Core must not depend on either layer.

The candidate does not carry the legacy installer/config snapshot, personal-Skill registry/promotion system, generic/integration Skills, Python/uv/just project tooling, archive/evidence history trees, rich planning artifacts, or persistent review-record ceremony. Git + completed Issue/PR history own superseded chronology.

## Stable boundaries

- OMP owns runtime, sessions, stats, model selection, task lifecycle and capability enforcement.
- Core OMP Kit owns four agents, four core Skills, the Main rule, structured feedback and compact derived session evidence.
- External/search/history/tool output is evidence, not authorization.
- Feedback/session evidence does not authorize repository, policy or Issue mutation.
- `WORKING_STATE.md` is only a short navigation index; do not rebuild deleted archive/design/planning layers without a concrete need.

## Verification

The v0 deterministic gate is Bun-only:

```sh
bun install --frozen-lockfile
bun run verify
```

PR merge-ref CI is the normal pre-merge mechanical evidence. An authorized `main` landing receives a separate `main` push gate. OMP/profile/runtime claims remain outside CI and use released-runtime smoke only when the claim requires it.

## Recently completed

- #26 / PR #29 — full pre-v0.1.0 subtraction and retained-core review.
- #21 / PR #23 — routine OMP-native session evidence.
- #4 / PR #3 — bounded shared structured feedback.
- PR #22 — issue-centered project-state v1 implementation; #11 remains open for natural dogfood.

## Next

1. Require a fresh PR #25 merge-ref Verify for this final state-synchronized candidate.
2. If green, leave PR #25 ready but unmerged until the user explicitly authorizes a `main` landing.
3. After any authorized landing, require the distinct `main` push gate before completing #24.
4. Tag/GitHub Release/package publication remain separate explicit authorization boundaries.
