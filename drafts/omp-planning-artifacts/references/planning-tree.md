# Planning Tree

## Minimal tree

Use this tree for full workflows:

```text
.planning/
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

## File ownership

- `STATE.md` records current workflow position and next action.
- `CONTEXT.md` records decisions and constraints.
- `RESEARCH.md` records evidence and confidence.
- `PLAN.md` records tasks, acceptance criteria, and verification steps.
- `SUMMARY.md` records implementation outcome and deviations.
- `REVIEW.md` records findings, fixes, waivers, and remaining risks.
- `VERIFICATION.md` records observed evidence and coverage.
- `CAPTURE.md` records documentation updates and ship inputs.
- `HANDOFF.md` records resume instructions when work pauses.

## Placement rule

Planning artifacts describe workflow state. Project documentation describes the current project. Move durable project knowledge to `docs/` during capture.
