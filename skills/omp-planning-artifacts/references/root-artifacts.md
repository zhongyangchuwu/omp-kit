# Root Artifact Contracts

Root project artifacts live at `.planning/` root and coordinate the whole workflow. They are not phase-local notes.

## Lifecycle table

| Artifact | Purpose | Produced by | Updated by | Consumed by |
| --- | --- | --- | --- | --- |
| `PROJECT.md` | Canonical project identity, core value, constraints, active scope, out-of-scope boundaries, and key decisions. | Project initialization. | Phase completion, validated pivots, changed constraints, new durable decisions. | All planning workflows; phase discussion, research, planning, review, verification. |
| `REQUIREMENTS.md` | Numbered, checkable definition of done with requirement IDs and phase traceability. | Project initialization after project context is written. | Scope changes, roadmap regeneration, phase completion, requirement validation or descoping. | Roadmap generation, plan creation, plan checks, discussion, verification. |
| `ROADMAP.md` | Single source of truth for phase order, phase goals, requirement coverage, success criteria, plan references, and progress. | Project initialization after requirements exist. | Phase add/insert/remove/edit, plan-phase, execute/verify phase, phase completion. | Discussion, planning, execution routing, progress, validation. |
| `STATE.md` | Compact current position tracker and resume digest. | After the initial roadmap exists. | Every phase boundary, plan completion, blocker, verification result, pause/resume, capture step. | Every workflow entry point, progress routing, resume, quick work, phase planning and execution. |

## Minimum valid shapes

### `PROJECT.md`

Required sections:

- `# <Project Name>`
- `## What This Is` — current 2-3 sentence product/repository description.
- `## Core Value` — one priority sentence that drives tradeoffs.
- `## Requirements` with `Validated`, `Active`, and `Out of Scope` subsections.
- `## Context` — implementation-relevant background.
- `## Constraints` — hard limits with rationale.
- `## Key Decisions` — durable decisions with rationale and outcome.

Optional: `## Business Context` for monetized or customer-facing projects only. Delete it for internal tools, experiments, or meta workspaces.

### `REQUIREMENTS.md`

Required sections:

- `# Requirements: <Project Name>`
- Defined date and core value reference from `PROJECT.md`.
- Current committed requirements grouped by category. Use stable IDs: `AUTH-01`, `PAY-02`, `API-03`.
- Deferred/future requirements separated from current scope.
- `## Out of Scope` with reasons.
- `## Traceability` table: `Requirement | Phase | Status`.
- Coverage summary: total current requirements, mapped count, unmapped count.

Requirement descriptions must be user-centric, testable, and atomic. Current-scope requirements use checkboxes; deferred requirements do not imply current commitment.

### `ROADMAP.md`

Required sections:

- `# Roadmap: <Project Name>`
- `## Overview` — one paragraph journey from current state to completion.
- `## Phases` — ordered phase checklist. Integer phases are planned work; decimal phases are inserted urgent work.
- `## Phase Details` — one detail block per phase:
  - `Goal`
  - `Depends on`
  - `Requirements` — IDs from `REQUIREMENTS.md`.
  - `Success Criteria` — 2-5 observable behaviors.
  - `Plans` — count or `TBD`.
  - `Plans:` checkbox list using `<phase>-<plan>` IDs.
- `## Progress` — phase progress table with plan counts, status, and completion date or `-`.

Completed phases may be marked with `[x]` and collapsed in `<details>` blocks when the phase list grows long, but current and upcoming phases must stay readable without expanding archived history.

### `STATE.md`

Required sections:

- Frontmatter with status and progress fields when workflow tooling expects it.
- `## Project Reference` pointing to `.planning/PROJECT.md`, with core value and current focus.
- `## Current Position` with phase, plan, status, last activity, and progress.
- `## Accumulated Context` or equivalent compact decisions/blockers digest.
- `## Session Continuity` with last session, stopped-at point, and resume file if present.

Keep `STATE.md` small enough to read at workflow start. It is a digest, not an archive.

## Generation and update flow

```text
project initialization
  -> PROJECT.md
  -> REQUIREMENTS.md
  -> ROADMAP.md
  -> STATE.md

add phase
  -> append to ROADMAP.md phases + details + progress table
  -> update REQUIREMENTS.md traceability for new or reassigned requirements

plan phase
  -> read PROJECT.md + STATE.md + ROADMAP phase details + mapped REQUIREMENTS
  -> write phase CONTEXT/RESEARCH/PLAN artifacts
  -> update ROADMAP plan refs/counts when plans become concrete

execute / verify phase
  -> write SUMMARY/VERIFICATION artifacts
  -> update ROADMAP progress and phase status
  -> update REQUIREMENTS traceability statuses for covered requirements
  -> update STATE current position and recent evidence

phase complete (transition)
  -> update ROADMAP progress + phase status
  -> update REQUIREMENTS traceability statuses
  -> evolve PROJECT.md validated/active/out-of-scope requirements + key decisions
  -> advance STATE.md to next phase (or mark project complete)
```

## Stage read/write rules

| Stage | Read | Write or update |
| --- | --- | --- |
| Bootstrap | source docs, repository context, user goals | `PROJECT.md`, `REQUIREMENTS.md`, `ROADMAP.md`, `STATE.md` |
| Discuss phase | `PROJECT.md`, `STATE.md`, target `ROADMAP.md` phase, mapped `REQUIREMENTS.md`, prior phase context | phase `CONTEXT.md`, optional discussion log, `STATE.md` |
| Plan phase | `PROJECT.md`, `STATE.md`, target roadmap phase, mapped requirements, `CONTEXT.md`, research sources | `RESEARCH.md`, `PLAN.md`, optional validation/pattern artifacts, roadmap plan refs/counts |
| Execute phase | selected `PLAN.md`, `STATE.md`, relevant code/docs | `SUMMARY.md`, changed implementation files, `STATE.md` |
| Verify phase | roadmap success criteria, requirements, plans, summaries, implementation | `VERIFICATION.md`, roadmap progress/status, requirement statuses, `STATE.md` |
| Capture/ship | verification evidence, summaries, project docs | docs updates, `CAPTURE.md`, `PROJECT.md` decisions/current state, `STATE.md` |
| Pause/resume | `STATE.md`, active phase artifacts | `HANDOFF.md` or continue-here file, `STATE.md` |

## Sync invariants

- Every requirement ID referenced in `ROADMAP.md` must exist in `REQUIREMENTS.md`.
- Every current requirement in `REQUIREMENTS.md` must map to exactly one current roadmap phase, or be explicitly listed as unmapped with a reason.
- `ROADMAP.md` phase status/progress must agree with `STATE.md` current position and completed counts.
- A phase cannot be marked complete in the roadmap until verification evidence exists for its success criteria.
- Requirement status becomes `Complete` only after the implementation is present, verified, and recorded in the phase evidence.
- Scope changes update both `REQUIREMENTS.md` and roadmap mappings; project-level rationale belongs in `PROJECT.md` constraints, out-of-scope, or key decisions.
