# Planning Tree

## Minimal tree

Use this tree for full workflows:

```text
.planning/
  PROJECT.md
  ROADMAP.md
  REQUIREMENTS.md
  STATE.md
  phases/
    001-short-name/
      CONTEXT.md
      RESEARCH.md
      PLAN.md
      SUMMARY.md
      REVIEW.md
      VERIFICATION.md
      CAPTURE.md
      HANDOFF.md
```

Create only the files the workflow needs.

## Root file ownership

- `PROJECT.md` records project identity, core value, constraints, and durable decisions that guide all phases.
- `ROADMAP.md` records phase order, phase goals, requirement IDs, success criteria, plan references, and progress.
- `REQUIREMENTS.md` records numbered, checkable acceptance criteria, scope boundaries, and phase traceability.
- `STATE.md` records current workflow position and next action.

## Phase file ownership

- `CONTEXT.md` records decisions and constraints.
- `RESEARCH.md` records evidence and confidence.
- `PLAN.md` records tasks, acceptance criteria, and verification steps.
- `SUMMARY.md` records implementation outcome and deviations.
- `REVIEW.md` records findings, fixes, waivers, and remaining risks.
- `VERIFICATION.md` records observed evidence and coverage.
- `CAPTURE.md` records documentation updates and ship inputs.
- `HANDOFF.md` records resume instructions when work pauses.

## Root artifact contracts

Root artifact content, generation flow, stage read/write rules, and sync invariants live in `root-artifacts.md`.

## Placement rule

Planning artifacts describe workflow state. Project documentation describes the current project. Move durable project knowledge to `docs/` during capture.
