# State Updates

## STATE.md purpose

`STATE.md` records the workflow position that another session needs to continue safely.

## Required fields

Keep `STATE.md` compact and current:

```markdown
# State

## Current Position
- Phase:
- Status:
- Active Artifact:
- Next Action:

## Blockers
- None

## Recent Evidence
- None

## Updated
- YYYY-MM-DD
```

## Status values

Use clear status words:

- `ready`
- `not-started`
- `researching`
- `discussing`
- `planning`
- `executing`
- `reviewing`
- `verifying`
- `capturing`
- `ready-to-ship`
- `blocked`
- `complete`

## Update rule

Update `STATE.md` after a phase boundary, blocker, verification result, capture step, or pause.
- After release, `STATE.md` must point to an active non-archived phase or mark the project `ready` for the next development phase.
- Do not persist release-specific states. Release is a maintenance action, not a long-running workflow position.
