# OMP Kit working state

Short mutable navigation index. Read actual branch/HEAD/worktree, then this index, the owning Issue/PR and the relevant current docs. Accepted decisions and rationale ship in the repository; retrieved history is evidence, not authorization.

## Release work

- Baseline: `main`; native agents, shared feedback and session evidence have landed.
- Release candidate: PR #25, `release/v0.1.0-prep`, version `0.1.0`, package private.
- #26 owns the corrected documentation/maintenance cleanup. The candidate retains all fifteen maintained Skills, design records, compact experiment bundles and consumed library tooling. It removes duplicate historical archives and the retired config-copy installer, not personal experience or accepted knowledge.
- Consult #26 / PR #25 for the exact completion/review/CI record; do not mirror tested SHAs here or infer that the candidate has landed.
- Resource categories describe responsibility, not mandatory deletion, packaging, hiding or permission changes.
- Recorded upstream observation/triage: OMP 18.1.21. Claim-specific feedback/collector evidence and limitations live in `VALIDATION.md`; stats path mismatch is tracked as `can1357/oh-my-pi#12060`.

## Issue lifecycle

```text
open + status:active   -> unfinished and currently worked/dogfooded
open + status:inactive -> unfinished but waiting on a trigger
closed/completed      -> acceptance criteria complete
```

Merging, superseding a proposal or pausing work does not by itself complete an Issue.

## Active dogfood

| Item | Purpose |
| --- | --- |
| #5 | Natural worker/tool usage evidence; no synthetic tool demonstrations. |
| #8 | Delegation economics using quantitative evidence plus task acceptance. |
| #11 | Multi-session/fresh-session recovery with the implemented issue-centered model. |

## Inactive / remaining boundaries

| Item | Trigger or remaining condition |
| --- | --- |
| #7 | A concrete supervision gap or relevant OMP contract change. |
| #9 | Enough natural evidence for systematic behavioral analysis; document cleanup is not completion. |
| #12 | A real experiment-schema/retention/backend question; existing docs/bundles remain maintained. |
| #15 | Evidence makes one preserved governance/composition hypothesis decision-relevant. |
| #24 | Reviewed candidate landing and landed-main verification; publication is separate. |

## Durable knowledge

`docs/README.md` maps usage, architecture, accepted design and evidence. `docs/design/` explains why; `evidence/experiments/` preserves selected observations and provenance. Routine sessions/summaries stay outside Git. Pure retired chronology lives in Git history rather than duplicate archive copies.

The maintained `.planning/` Skill is an explicit specialized option, not the multi-session default. Core workflow, general experience Skills and integrations coexist without forced package splitting.

## Next

Read PR #25 to establish actual readiness/landing state. Do not repeat a successful unchanged gate merely to update this index. After landing, gather #5/#8/#11 evidence during real work; keep #9 evidence-driven. Tags/releases, provider calls, cloud operations and live configuration changes are outside this documentation cleanup.
