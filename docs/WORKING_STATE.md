# OMP Kit working state

Short mutable navigation index. Current facts come from the repository/runtime; accepted decisions and rationale ship in current docs and `docs/design/`. Detailed unfinished work lives in Issues and implementation/review evidence in PRs.

## Start

Inspect actual branch, HEAD and worktree. Read this index, then the owning Issue/PR and only the relevant current references. Retrieved history is evidence, not authorization.

## Current

- Baseline: `main`; native agents, shared feedback and session-evidence collector have landed.
- Release candidate: PR #25, `release/v0.1.0-prep`, version `0.1.0`, package private.
- Cleanup owner: #26. The earlier core-only removal was rejected; the candidate restores maintained Skills, design records and compact experiment evidence, and removes only historical archive copies and the retired config-copy installer.
- Resource categories describe responsibilities; they do not force removal, separate packages or discovery changes.
- Latest upstream observed/triaged in the recorded review: OMP 18.1.21.
- Runtime evidence: OMP 18.1.21 Main/worker feedback and collector acceptance; limits in `VALIDATION.md`. Upstream stats folder mismatch: `can1357/oh-my-pi#12060`.

## Issue lifecycle

```text
open + status:active   -> unfinished and currently worked/dogfooded
open + status:inactive -> unfinished but waiting on a trigger
closed/completed      -> acceptance criteria complete
```

Merging, superseding a proposal or pausing work does not by itself complete an Issue.

## Active

| Item | Purpose |
| --- | --- |
| #26 / PR #25 | Correct the cleanup scope, review retained knowledge and verify the release candidate; consult the Issue/PR for exact completion and CI. |
| #5 | Natural worker/tool usage evidence, not synthetic tool demonstrations. |
| #8 | Delegation economics using quantitative evidence plus task acceptance. |
| #11 | Real multi-session/fresh-session recovery of the implemented issue-centered model. |

## Inactive / release boundary

| Item | Trigger or remaining condition |
| --- | --- |
| #7 | A concrete supervision gap or relevant OMP contract change. |
| #9 | Sufficient real evidence for systematic behavioral scaffolding analysis; not completed by document cleanup. |
| #12 | A real experiment-retention/schema/backend question; no standalone test campaign now. |
| #15 | Specific evidence makes one existing governance/composition hypothesis decision-relevant. |
| #24 | Land the reviewed release candidate and verify landed `main` when authorized; publication is separate. |

## Next

Use #26 / PR #25 read-back to establish whether cleanup and CI are complete. Do not rerun an unchanged successful gate merely to update this index. Preserve all maintained Skills unless concrete incorrectness or duplication supports a targeted edit.

After landing, gather #5/#8/#11 evidence during real work. #9 remains an evidence-driven analysis, not a reason to preemptively erase user experience. Tags, releases and external configuration changes are not part of this cleanup.
