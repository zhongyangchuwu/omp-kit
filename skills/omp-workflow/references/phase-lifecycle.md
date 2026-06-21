# Phase Lifecycle

A phase is the central unit of work. Each phase delivers a coherent outcome, tracked in ROADMAP.md, containing one or more plans.

## Phase model

```text
not-started → discussing → planning → executing → verifying → complete
```

| State | Meaning | Produces | Exit gate |
|---|---|---|---|
| `not-started` | Phase exists in ROADMAP.md, no artifacts | — | User or workflow initiates `discuss` |
| `discussing` | Collecting context, decisions, constraints | `CONTEXT.md` | Context is sufficient for planning |
| `planning` | Creating executable plans | `RESEARCH.md` (optional), `PLAN.md`(s) | Plan check passes |
| `executing` | Implementing plans | `SUMMARY.md`(s), changed source files | All plans have summary |
| `verifying` | Proving behavior against success criteria | `VERIFICATION.md` | All success criteria have evidence |
| `complete` | Phase done, root artifacts updated | `CAPTURE.md`, synced root artifacts | Transition to next phase or project done |

## State transitions

### not-started → discussing

User or workflow selects this phase to begin work. Read ROADMAP.md phase details (goal, requirements, dependencies, success criteria) and REQUIREMENTS.md mapped requirements before starting discussion.

### discussing → planning

CONTEXT.md captures decisions, constraints, and approach. Output must be approved before proceeding to planning. The discussion should answer:

- What is the approach for this phase?
- What decisions constrain implementation?
- What known risks exist?
- What research is needed before planning?

### planning → executing

PLAN.md(s) exist with executable tasks, acceptance criteria, and verification steps. Plans must reference their target phase requirements and success criteria. Optional RESEARCH.md provides domain evidence. Plan check gate: confirm the plans, together, satisfy all phase requirements and success criteria.

### executing → verifying

All plans have committed SUMMARY.md files. Each summary records what was implemented, deviations from plan, and verification evidence. Subagent coordination rules apply — the controller integrates results and runs final checks.

### verifying → complete

VERIFICATION.md proves all success criteria are met. Every requirement mapped to this phase has evidence. Verification is a separate gate from execution: it proves behavior, not just that code was written.

### complete → next phase (transition)

When a phase completes:

1. Update ROADMAP.md: phase checkbox `[x]`, progress table status → `Complete` with date.
2. Update REQUIREMENTS.md: covered requirements → `Complete` in traceability table.
3. Evolve PROJECT.md:
   - Move validated requirements from Active to Validated.
   - Move invalidated requirements to Out of Scope with reason.
   - Add emerged requirements to Active.
   - Log new decisions in Key Decisions table.
   - Update "What This Is" if the product meaningfully changed.
   - Update "Last updated" footer.
4. Update STATE.md:
   - Current position advances to next phase (or marks project complete).
   - Status resets to `not-started` for the next phase.
   - Record any blockers or concerns.
5. Clean up stale handoff files (`.continue-here*` in the completed phase directory).
6. Write CAPTURE.md: documentation updates and durable project knowledge from this phase.

If this was the last phase in ROADMAP.md, the project is complete. Update STATE.md to reflect completion; do not create new phases without user direction.

Completed phases remain in `.planning/phases/` until the project cuts a published release. During release, selected completed phase directories move to `.planning/archive/releases/<version>/phases/`, and completed scope moves out of root planning docs into the release archive. Release is a post-completion cleanup and evidence step, not a planning container.

## Phase insertion

New urgent work between existing phases:

1. Insert a decimal phase in ROADMAP.md (e.g., Phase 2.1 between Phase 2 and Phase 3).
2. Add phase details block with Goal, Depends on, Requirements, Success Criteria.
3. Update the progress table row.
4. Update REQUIREMENTS.md traceability for any new or reassigned requirements.

Decimal phases execute in numeric order: 2 → 2.1 → 2.2 → 3.

## Artifacts per state

| State | Artifacts in phase directory |
|---|---|
| not-started | (none) |
| discussing | `CONTEXT.md` (in progress) |
| planning | `CONTEXT.md`, `RESEARCH.md` (optional), `PLAN.md`(s) |
| executing | above + `SUMMARY.md`(s) |
| verifying | above + `VERIFICATION.md` |
| complete | above + `CAPTURE.md` |

Root artifacts (`PROJECT.md`, `REQUIREMENTS.md`, `ROADMAP.md`, `STATE.md`) are read at every state and updated during transition (complete → next phase).

## Plan completion within a phase

A phase can have multiple plans. Plans execute one at a time within a phase. Each plan produces its own SUMMARY.md. The phase advances to `verifying` only when all plans have summaries. Plans can be re-ordered between phases but must stay within their owning phase.

## Phase dependencies

A phase declares its dependencies in ROADMAP.md (`Depends on`). Dependencies must be `complete` before the dependent phase can start `discussing`. The workflow enforces this by checking ROADMAP.md progress before advancing STATE.md.

## Pause and resume

If work pauses mid-phase:

1. Write a phase-local handoff file (e.g., `HANDOFF.md` or `.continue-here-<timestamp>.md`).
2. Record the current state, completed steps, next action, and open decisions.
3. Update STATE.md Session Continuity to reference the handoff file.
4. On resume: read STATE.md → locate handoff file → restore position → continue.
