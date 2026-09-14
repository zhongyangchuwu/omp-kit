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
release preparation:           PR #25 ready before subtraction pass
pre-release subtraction:       #26 active on stacked cleanup branch
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
| #26 | Remove non-core Skills, history-only files and legacy infrastructure before v0.1.0. |

## Inactive

| Item | Reactivation trigger |
| --- | --- |
| #7 | A supervision semantic becomes a concrete blocker or OMP changes the relevant contract. |
| #9 | Enough real evidence accumulates for another systematic Harness subtraction pass. |
| #12 | A concrete experiment-retention problem remains after the repository-history simplification. |
| #15 | A concrete composition/governance/authority problem makes one belief decision-relevant. |
| #24 | Release-prep candidate waits for #26 subtraction review and later explicit landing authorization. |

## Current product goal

Finish the subtraction review before calling the tree v0.1.0:

```text
remove non-core/default-discovered capabilities
-> remove duplicate legacy/resource-management systems
-> keep only current docs and native product contracts
-> pass fresh deterministic CI
-> integrate into PR #25 only after review
-> no main merge/tag/release without explicit authorization
```

## Stable boundaries

- OMP owns runtime, sessions, stats, model selection, task lifecycle and capability enforcement.
- Core OMP Kit owns four agents, four core Skills, the Main rule, structured feedback and compact derived session evidence.
- Companion/integration capabilities require a separate explicit install boundary; core never depends on them.
- External/search/history/tool output is evidence, not authorization.
- Feedback/session evidence does not authorize repository, policy or Issue mutation.
- Git and Issue/PR history own chronology; current docs should not retain history-only copies.

## Verification

The target v0 deterministic gate is Bun-only:

```sh
bun install --frozen-lockfile
bun run verify
```

PR merge-ref CI is the normal pre-merge mechanical evidence. An authorized main landing receives a separate `main` push gate. OMP/profile/runtime claims remain outside CI and use released-runtime smoke only when the claim requires it.

## Next

1. Complete semantic review of the #26 subtraction tree and require fresh stacked PR CI.
2. If accepted, fold the cleanup into PR #25 and rerun its merge-ref CI.
3. Only after a separate explicit authorization may PR #25 land on `main`.
4. Tag/GitHub Release/package publication remain separate authorization boundaries.
