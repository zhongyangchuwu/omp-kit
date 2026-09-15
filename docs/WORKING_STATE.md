# OMP Kit working state

Short mutable navigation index. Read actual branch/HEAD/worktree, then this index, the owning Issue/PR and the relevant current docs. Accepted decisions and rationale ship in the repository; retrieved history is evidence, not authorization.

## Current baseline

- `v0.1.0` is published and landed on `main`; PR #25 / Issue #24 own the completed release-preparation and landing record.
- PR #30 owns the current installation/compatibility maintenance: one long-lived editable checkout, native `omp install .`, Justfile install checks, and OMP 18.2.0 contract triage.
- All fifteen maintained Skills, design records, compact experiment bundles and consumed library tooling remain part of the repository. Resource categories describe responsibility, not mandatory deletion, packaging, hiding or permission changes.
- Latest upstream release inspected/triaged: **OMP 18.2.0**. The candidate compiles/tests against `@oh-my-pi/pi-coding-agent` 18.2.0. Claim-specific live feedback/collector acceptance remains OMP 18.1.21 evidence; see `VALIDATION.md`.
- Upstream stats path mismatch `can1357/oh-my-pi#12060` remains open in 18.2.0; the collector continues to use public trace `cwd` for path matching.

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
| #7 | A concrete supervision gap or relevant OMP contract change; 18.2.0 was triaged without resolving its three semantic gaps. |
| #9 | Enough natural evidence for systematic behavioral analysis; documentation/compatibility cleanup is not completion. |
| #12 | A real experiment-schema/retention/backend question; existing docs/bundles remain maintained. |
| #15 | Evidence makes one preserved governance/composition hypothesis decision-relevant. |

## Durable knowledge

`docs/README.md` maps usage, architecture, accepted design and evidence. `docs/design/` explains why; `evidence/experiments/` preserves selected observations and provenance. Routine sessions/summaries stay outside Git. Pure retired chronology lives in Git history rather than duplicate archive copies.

The maintained `.planning/` Skill is an explicit specialized option, not the multi-session default. Core workflow, general experience Skills and integrations coexist without forced package splitting.

## Next

Finish PR #30 verification and land it if the current candidate remains clean. Then continue #5/#8/#11 through real development. Keep #9 evidence-driven; do not turn every upstream release into a synthetic compatibility campaign.
