# Project Initialization

Bootstrap a project from idea or existing code into `.planning/` artifacts ready for phase-by-phase execution. This is the gateway to full-mode workflows.

## When to use

Use this when the task requires project-level planning and the workspace has:

- No `AGENTS.md` (or equivalent agent context file)
- No `.planning/` directory

If both `AGENTS.md` and `.planning/` exist, skip initialization — proceed directly to the workflow's active phase.

If `AGENTS.md` exists but `.planning/` is missing, prompt the user: existing project context detected but no planning state; do they want to bootstrap `.planning/` from the current state?

## Detection

Before any other action:

- Check for `AGENTS.md` (or `.claude/CLAUDE.md`, `.cursorrules`, `.github/copilot-instructions.md` depending on runtime).
- Check for `.planning/` directory.
- Check for substantive existing code (not just scaffold, `README.md`, or license files).

| AGENTS.md | .planning/ | Code | Path |
|---|---|---|---|
| absent | absent | absent | Greenfield initialization |
| absent | absent | present | Brownfield initialization |
| present | absent | any | Offer bootstrap from AGENTS.md |
| any | present | any | Skip initialization |

## Greenfield path

New project from scratch. The repository is empty or contains only scaffold files.

### 1. Discuss project goals

Open the conversation. Start with one freeform question:

> "What do you want to build?"

Follow the thread, not a script:

- **Clarify vagueness.** "Good" means what? "Users" means who? "Simple" means how?
- **Make abstract concrete.** "Walk me through using this." "What does that actually look like?"
- **Surface assumptions.** What tech stack is already decided? What constraints exist?
- **Find edges.** What is explicitly out of scope? What would make this project a failure?
- **Define done.** How will you know this is working? What does success look like?

Stop when you can write a clear PROJECT.md — you understand what they want, why, who it's for, and what done looks like. Confirm with the user before proceeding.

### 2. Write PROJECT.md

Create `.planning/PROJECT.md` with these sections:

```markdown
# <Project Name>

## What This Is

<2-3 sentence description of what this does and who it's for>

## Core Value

<One priority sentence that drives tradeoffs>

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] <Requirement 1>
- [ ] <Requirement 2>

### Out of Scope

- <Exclusion> — <reason>
```

Include `## Context`, `## Constraints`, and `## Key Decisions` sections with whatever was surfaced during discussion.

### 3. Write REQUIREMENTS.md

Extract checkable requirements from the discussion. Use stable requirement IDs grouped by category:

```markdown
# Requirements: <Project Name>

**Defined:** <date>
**Core Value:** <from PROJECT.md>

## Current Requirements

### <Category 1>

- [ ] **<CAT>-01**: <User-centric, testable, atomic description>

### <Category 2>

- [ ] **<CAT>-02**: <Description>

## Deferred

<Requirements acknowledged but not in current scope>

## Out of Scope

| Feature | Reason |
|---|---|
| <Feature> | <Why excluded> |

## Traceability

| Requirement | Phase | Status |
|---|---|---|
| <CAT>-01 | Phase 1 | Pending |
```

**Rules:**
- Requirements must be user-centric, testable, and atomic.
- IDs use the format `CATEGORY-NUMBER` (e.g., `AUTH-01`, `API-03`).
- Current-scope requirements use `[ ]` checkboxes; deferred do not imply current commitment.
- Traceability table is populated during roadmap creation — initially list all current requirements with target phases from the roadmap.

### 4. Write ROADMAP.md

Decompose requirements into an ordered phase checklist:

```markdown
# Roadmap: <Project Name>

## Overview

<One paragraph describing the journey from current state to completion>

## Phases

- [ ] **Phase 1: <Name>** — <One-line description>
- [ ] **Phase 2: <Name>** — <One-line description>

## Phase Details

### Phase 1: <Name>

**Goal:** <What this phase delivers>
**Depends on:** Nothing (first phase)
**Requirements:** <REQ-01, REQ-02>
**Success Criteria** (what must be TRUE):
  1. <Observable behavior from user perspective>
  2. <Observable behavior from user perspective>
**Plans:** <count or TBD>

### Phase 2: <Name>

**Goal:** <What this phase delivers>
**Depends on:** Phase 1
**Requirements:** <REQ-03, REQ-04>
**Success Criteria** (what must be TRUE):
  1. <Observable behavior from user perspective>
**Plans:** <count or TBD>

## Progress

| Phase | Plans Complete | Status | Completed |
|---|---|---|---|
| 1. <Name> | 0/<N> | Not started | — |
```

**Rules:**
- Integer phases (1, 2, 3) are planned work; decimal phases (2.1) are urgent insertions.
- Each phase must have a coherent goal — one clear deliverable.
- Success criteria must be observable behaviors, not implementation details.
- Requirement IDs must reference entries in `REQUIREMENTS.md`.
- Phase count: 3-8 phases is typical for a well-scoped project.

### 5. Write STATE.md

Create `.planning/STATE.md` as the initial position tracker:

```markdown
# Project State

## Project Reference

See: .planning/PROJECT.md (updated <date>)

**Core value:** <one-liner from PROJECT.md>
**Current focus:** Phase 1: <Name>

## Current Position

Phase: 1 of <N> (<Phase 1 name>)
Status: Not started — ready to discuss
Last activity: <date> — Project initialized

## Accumulated Context

### Decisions

<Key decisions from PROJECT.md, brief summary>

### Blockers/Concerns

None yet.

## Session Continuity

Last session: <date>
Stopped at: Initialization complete
```

Keep STATE.md compact — it is a digest, not an archive. Read at the start of every workflow session.

### 6. Write AGENTS.md (optional)

Ask the user if they want an `AGENTS.md` summarizing project conventions for future agents. If yes, write it based on decisions made during discussion. This is optional — the workflow does not depend on it.

## Brownfield path

Existing code, no `.planning/`.

### 1. Offer codebase exploration

The repository has substantive code. Before discussing goals:

> "I detected existing code in this directory. Would you like to explore the codebase first to ground the planning in what already exists?"
>
> - **Explore codebase** — Run codebase exploration before discussing goals (Recommended)
> - **Skip exploration** — Proceed directly to discussion

If "Explore codebase": follow `codebase-exploration.md`, then resume at step 2.

### 2. Discuss project goals

Same as greenfield step 1, but informed by the codebase map if available. The codebase map's `ARCHITECTURE.md` and `CONCERNS.md` provide concrete starting points:

- "The existing codebase handles X, Y, Z. What needs to change or be added?"
- "I see these existing patterns — do you want to keep them or change direction?"

### 3. Write PROJECT.md (brownfield)

Same structure as greenfield, but populate `Validated` requirements from existing code:

```markdown
### Validated

- ✓ <Existing capability 1> — existing
- ✓ <Existing capability 2> — existing

### Active

- [ ] <New requirement 1>
- [ ] <New requirement 2>
```

Read `.planning/codebase/ARCHITECTURE.md` and `STRUCTURE.md` to identify what the codebase already does. These become the initial Validated set — they shipped and proved valuable by virtue of existing.

### Steps 4-6

Same as greenfield steps 3-5 (REQUIREMENTS.md, ROADMAP.md, STATE.md). AGENTS.md step is optional but recommended for brownfield projects since the codebase exploration already surfaced conventions and patterns.

## Completion

After initialization:

- STATE.md current position should read `Phase 1: Not started — ready to discuss`.
- All current requirements in REQUIREMENTS.md traceability table map to a roadmap phase.
- ROADMAP.md progress table lists all phases with `Not started` status.
- The project is ready for the first `discuss → plan → execute → verify → complete` cycle.
